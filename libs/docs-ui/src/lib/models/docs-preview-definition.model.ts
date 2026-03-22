import { Provider, Type } from '@angular/core';

export interface DocsPreviewDefinition {
  label: string;
  component: Type<unknown>;
  providers?: Provider[];
  code?: string;
  viewports?: DocsPreviewViewport[];
}

export interface DocsPreviewViewport {
  label: string;
  width: number;
}
