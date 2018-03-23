const projects = [':test:a:c', ':test:b'];

module.exports = workspace => {
  projects.forEach(name => {
    const project = workspace.project(name);

    project.task('build', task => {});
  });
};
