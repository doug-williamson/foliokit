import { Rule } from '@angular-devkit/schematics';
export interface NgAddOptions {
    project?: string;
    firebaseProject: string;
    siteId: string;
    appName: string;
}
export declare function ngAdd(options: NgAddOptions): Rule;
