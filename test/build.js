module.exports = (workspace, project) => {
  project.task('build', task => {
    task.dependsOn(workspace.task(':test:a:c:dep'));
  });
};
