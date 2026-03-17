import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmsCore } from './cms-core';

describe('CmsCore', () => {
  let component: CmsCore;
  let fixture: ComponentFixture<CmsCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsCore],
    }).compileComponents();

    fixture = TestBed.createComponent(CmsCore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
