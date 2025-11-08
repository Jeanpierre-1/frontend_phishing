import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalisisDetalleComponent } from './analisis-detalle.component';

describe('AnalisisDetalleComponent', () => {
  let component: AnalisisDetalleComponent;
  let fixture: ComponentFixture<AnalisisDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalisisDetalleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnalisisDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
