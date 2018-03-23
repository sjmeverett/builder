import { Project } from './project';
import { Task, sort } from './task';
import * as globby from 'globby';
import * as _ from 'lodash';

export interface WorkspaceOptions {
  buildFileName?: string;
}

const defaultWorkspaceOptions: WorkspaceOptions = {
  buildFileName: 'build.js'
};

export class Workspace {
  private projects: _.Dictionary<Project>;

  constructor(
    public readonly rootDir: string,
    public readonly options = defaultWorkspaceOptions
  ) {
    this.projects = {};
  }

  async loadProjects() {
    const buildFiles = await globby(
      [`**/${this.options.buildFileName}`, '!node_modules/**'],
      { cwd: this.rootDir }
    );

    const projects = buildFiles.map(file => new Project(this, file));
    await Promise.all(projects.map(project => project.load()));
    await Promise.all(projects.map(project => project.define()));

    this.projects = _.keyBy(projects, project => project.name);
  }

  project(name: string) {
    const project = this.projects[name];

    if (!project) {
      throw new Error(`could not find project ${name}`);
    }

    return project;
  }

  parseTaskName(name: string) {
    const match = name.match(/^((.*?):)?([^:]+)$/);

    if (!match) {
      throw new Error(`task name '${name}' is invalid`);
    }

    return {
      project: match[2] ? this.project(match[2]) : null,
      task: match[3]
    };
  }

  task(name: string) {
    const { project, task } = this.parseTaskName(name);

    if (project) {
      return project.task(task);
    } else {
      return null;
    }
  }

  tasks(names: string[]) {
    return _(names)
      .map(name => this.parseTaskName(name))
      .flatMap(
        ({ project, task }) =>
          project ? project.task(task) : _.map(this.projects, p => p.task(task))
      )
      .filter()
      .value();
  }

  runTask(name) {
    sort(this.tasks([name])).forEach(task => task.run());
  }
}
