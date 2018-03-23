import { Workspace } from './workspace';
import * as path from 'path';

const workspace = new Workspace(path.join(__dirname, '..', '..'));

workspace
  .loadProjects()
  .then(() => {
    workspace.runTask('build');
  })
  .catch(console.error);
