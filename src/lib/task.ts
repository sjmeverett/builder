import { Project } from './project';
import * as _ from 'lodash';

export interface TaskDefinition {
  (task: Task): void;
}

export class Task {
  public readonly dependencies: Task[];
  public id: string;

  constructor(
    public readonly project: Project,
    public readonly name: string,
    private readonly definition: TaskDefinition
  ) {
    this.dependencies = [];
    this.id = _.uniqueId('task_');
  }

  dependsOn(...tasks: Task[]) {
    this.dependencies.push(...tasks);
    return this;
  }

  define() {
    this.definition(this);
  }

  run() {
    console.log(`running ${this.project.name}:${this.name}`);
  }
}

export function sort(tasks: Task[]) {
  const sorted: Task[] = [];
  const marks = new Set<string>();
  const visited = new Set<string>();

  while (tasks.length) {
    visit(tasks.pop(), sorted, marks, visited);
  }

  return sorted;
}

function visit(
  task: Task,
  sorted: Task[],
  marks: Set<string>,
  visited: Set<string>
) {
  if (visited.has(task.id)) {
    return;
  }

  if (marks.has(task.id)) {
    throw new Error(`cyclic dependency on ${task.project.name}:${task.name}`);
  }

  marks.add(task.id);
  task.dependencies.forEach(dependency =>
    visit(dependency, sorted, marks, visited)
  );
  visited.add(task.id);
  sorted.push(task);
}
