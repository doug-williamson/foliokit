import { Rule } from '@angular-devkit/schematics';
export interface Schema {
    adminEmail: string;
    project?: string;
}
export declare function ngAdd(options: Schema): Rule;
