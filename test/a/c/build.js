module.exports = (workspace, project) => {
  project.task('dep', task => {});

  project.task('build', task => {
    task.dependsOn(project.task('dep'));
  });
};
