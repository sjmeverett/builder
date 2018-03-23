import { PromiseArray } from './promise-array';
import { Path } from './path';
import { Task, TaskDefinition } from './task';
import { Workspace } from './workspace';
import * as _ from 'lodash';
import * as fs from 'mz/fs';
import * as path from 'path';

export const projectBuildFileName = 'build.js';
export const projectPathSeparator = ':';

export interface DefineProjectFunction {
  (project: Project): Promise<void> | void;
}

const isDirectory = (path: string) =>
  fs.lstat(path).then(file => file.isDirectory());

export class Project {
  private readonly tasks: _.Dictionary<Task>;
  public name: string;
  private _define: DefineProjectFunction;
  public subprojects: _.Dictionary<Project>;

  constructor(
    public readonly rootProject: Project,
    public readonly directory: string
  ) {
    this.tasks = {};
    this.name = path.basename(directory);
  }

  async load(): Promise<void> {
    this._define = require(path.join(this.directory, projectBuildFileName));
    this.subprojects = _.keyBy(
      await this.scan(this.directory, projectBuildFileName),
      p => p.name
    );
  }

  private async scan(directory: string, file: string): Promise<Project[]> {
    const fullPath = path.join(directory, file);

    if (await fs.exists(fullPath)) {
      const project = new Project(this.rootProject, fullPath);
      await project.load();
      return [project];
    }

    return new PromiseArray(fs.readdir(directory))
      .filter(isDirectory)
      .flatMap<Project>(child => this.scan(path.join(directory, child), file));
  }

  private _project(components: string[], basename?: string) {
    if (!basename) {
      components = components.slice();
      basename = components.pop();
    }

    const project = components.reduce(
      (project, component) => project && project.project(component),
      this
    );

    return (project && project.subprojects[basename]) || null;
  }

  project(path: string | Path): Project {
    const p = typeof path === 'string' ? new Path(path) : path;

    if (p.isMatchAllTask) {
      throw new Error('not a valid project path');
    }

    if (p.isFullyQualified) {
      return this.rootProject.project(p);
    }

    return this._project(p.components, p.basename);
  }

  task(path: string | Path): Task {
    const p = typeof path === 'string' ? new Path(path) : path;
    const project = this._project(p.components);

    if (p.isMatchAllTask) {
      const tasks = this._matchTask([], p.basename);
      const task = new Task(this.rootProject, `match task: ${p.raw}`, null);
      task.dependsOn(...tasks);
      return task;
    }

    return project.tasks[p.basename] || null;
  }

  private _matchTask(tasks: Task[], taskName: string) {
    const task = this.task[taskName];

    if (task) {
      tasks.push(task);
    }

    _.forEach(this.subprojects, subproject => {
      subproject._matchTask(tasks, taskName);
    });

    return tasks;
  }

  define() {
    if (typeof this._define === 'function') {
      this._define(this);
    }
  }

  defineTasks() {
    return _.map(this.tasks, task => task.define());
  }
}
