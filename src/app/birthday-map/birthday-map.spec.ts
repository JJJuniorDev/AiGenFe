import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirthdayMap } from './birthday-map';

describe('BirthdayMap', () => {
  let component: BirthdayMap;
  let fixture: ComponentFixture<BirthdayMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirthdayMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
