import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmsAdminUi } from './cms-admin-ui';

describe('CmsAdminUi', () => {
  let component: CmsAdminUi;
  let fixture: ComponentFixture<CmsAdminUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsAdminUi],
    }).compileComponents();

    fixture = TestBed.createComponent(CmsAdminUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
