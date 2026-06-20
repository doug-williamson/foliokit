import { Directive } from '@angular/core';

// eslint-disable-next-line @angular-eslint/directive-selector -- public content-projection slot; an unprefixed attribute is the intended, stable API.
@Directive({ selector: '[shellNavFooter]', standalone: true })
export class ShellNavFooterDirective {}
