const globby = require('globby');
const _ = require('lodash');
const path = require('path');

const filename = 'build.js';

class Project {
  constructor(rootDir, buildFile) {
    this.buildFile = path.join(rootDir, buildFile);
    this.dir = path.dirname(this.buildFile);

    const dir = buildFile.slice(0, -filename.length - 1);
    this.name = ':' + dir.replace(/\//g, ':');
    this.rootDir = rootDir;
    this.load = require(this.buildFile);

    this.tasks = {};
  }

  defineTask(name, task) {
    this.tasks[name] = task;
  }
}

class Workspace {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  loadProjects() {
    return globby([`**/${filename}`, '!node_modules/**'], { cwd: this.rootDir })
      .then(buildFiles =>
        buildFiles.map(buildFile => new Project(this.rootDir, buildFile))
      )
      .then(projects => {
        this.projects = _.keyBy(projects, project => project.name);
        return projects;
      })
      .then(projects =>
        projects.forEach(
          project =>
            typeof project.load === 'function' && project.load(this, project)
        )
      );
  }

  project(name) {
    const project = this.projects[name];
    if (!project) {
      throw new Error(`could not find project ${name}`);
    }
    return project;
  }

  runTask(name) {
    const match = name.match(/^((.*?):)?([^:]+)$/);

    if (!match) {
      throw new Error();
    }

    const project = match[2];
    const task = match[3];

    if (project) {
      return this.project(project).tasks[task]();
    } else {
      for (const k in this.projects) {
        const fn = this.projects[k].tasks[task];
        if (fn) fn();
      }
    }
  }
}

const workspace = new Workspace(__dirname);

workspace
  .loadProjects()
  .then(() => {
    workspace.runTask('build');
  })
  .catch(console.error);
