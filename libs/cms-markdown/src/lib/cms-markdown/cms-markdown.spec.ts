import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMarkdown } from 'ngx-markdown';
import { MarkdownComponent } from './cms-markdown';

describe('MarkdownComponent', () => {
  let component: MarkdownComponent;
  let fixture: ComponentFixture<MarkdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownComponent],
      providers: [provideMarkdown()],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('content', '');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
