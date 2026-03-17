import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmsMarkdown } from './cms-markdown';

describe('CmsMarkdown', () => {
  let component: CmsMarkdown;
  let fixture: ComponentFixture<CmsMarkdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsMarkdown],
    }).compileComponents();

    fixture = TestBed.createComponent(CmsMarkdown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
