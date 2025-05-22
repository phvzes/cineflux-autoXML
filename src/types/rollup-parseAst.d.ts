declare module 'rollup/parseAst' {
  export interface ParseAstOptions {
    // Define the options interface based on rollup's parseAst function
    code: string;
    acorn?: any;
    acornInjectPlugins?: any[];
    [key: string]: any;
  }

  export function parseAst(options: ParseAstOptions): any;
  export default parseAst;
}
