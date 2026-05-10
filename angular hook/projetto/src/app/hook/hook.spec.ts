import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hook } from './hook';

describe('Hook', () => {
  let component: Hook;
  let fixture: ComponentFixture<Hook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hook]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hook);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
