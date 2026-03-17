import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmsUi } from './cms-ui';

describe('CmsUi', () => {
  let component: CmsUi;
  let fixture: ComponentFixture<CmsUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsUi],
    }).compileComponents();

    fixture = TestBed.createComponent(CmsUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
