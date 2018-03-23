export class Path {
  public readonly isFullyQualified: boolean = false;
  public readonly isMatchAllTask: boolean = false;
  public readonly components: string[];
  public readonly basename: string;
  public static readonly SEPARATOR = ':';

  constructor(public readonly raw: string) {
    let path = raw;

    if (path[0] === Path.SEPARATOR) {
      this.isFullyQualified = true;
      path = path.substring(1);
    }

    const components = [];

    while (path.length) {
      const pos = path.indexOf(Path.SEPARATOR);

      if (pos > 0) {
        components.push(path.substring(0, pos));
        path = path.substring(pos + 1);
      } else {
        if (pos === 0) {
          path = path.substring(1);

          if (path.indexOf(Path.SEPARATOR) > -1) {
            throw new Error('malformed path');
          }

          this.isMatchAllTask = true;
        }

        components.push(path);
        break;
      }
    }

    this.basename = components.pop();
    this.components = components;
  }
}
