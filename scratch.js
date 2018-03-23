
const jsProjects = [
  ':digital:frontend',
  ':common:util'
];

module.exports = (builder) => {
  jsProjects.map(builder.project)
    .then((project) => {
      project.task('build', (task) => {
        task
          .inputs('src/**/*.ts', {root: 'src'})
          .outputs((src) => src.outputs(src.name.replace(/\.ts$/, '.js')))
          .process(ts());
      });
    
      project.task('webpack', (task) => {
        task.inputs('client/**/*.ts')
          .forEach((src) => {
            src.outputs('bundle.js');
          });
        
        task.process()
      });
    
      project.task('test', (task) => {
    
      });
    })
};
