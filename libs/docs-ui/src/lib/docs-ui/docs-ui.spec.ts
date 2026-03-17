import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocsUi } from './docs-ui';

describe('DocsUi', () => {
  let component: DocsUi;
  let fixture: ComponentFixture<DocsUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocsUi],
    }).compileComponents();

    fixture = TestBed.createComponent(DocsUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
