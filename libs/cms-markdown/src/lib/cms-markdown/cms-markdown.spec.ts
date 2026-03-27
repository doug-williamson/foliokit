import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMarkdown } from 'ngx-markdown';
import { MarkdownComponent } from './cms-markdown';

describe('MarkdownComponent', () => {
  let fixture: ComponentFixture<MarkdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownComponent],
      providers: [provideMarkdown()],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownComponent);
    fixture.componentRef.setInput('content', '');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders plain markdown content', async () => {
    fixture.componentRef.setInput('content', '# Hello World');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Hello World');
  });

  it('replaces embedded media tokens with resolved download URLs', async () => {
    const media = {
      'hero-img': { downloadUrl: 'https://cdn.example.com/hero.jpg', path: 'images/hero.jpg' },
    };
    fixture.componentRef.setInput('content', '![Hero image](hero-img)');
    fixture.componentRef.setInput('embeddedMedia', media);
    fixture.detectChanges();
    await fixture.whenStable();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(img?.src).toBe('https://cdn.example.com/hero.jpg');
  });

  it('leaves unmatched tokens unchanged — no crash', async () => {
    fixture.componentRef.setInput('content', '![alt](unknown-token)');
    fixture.componentRef.setInput('embeddedMedia', {});
    fixture.detectChanges();
    await fixture.whenStable();
    // Token not in media map → original markdown preserved, no error thrown
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Error');
  });
});
