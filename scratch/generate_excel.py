import pandas as pd
import os

def generate_excel_dataset(output_path):
    # Create mock data with specific types and anomalies for Lesson 3 Lab
    data = {
        'id_orden': ['O1001', 'O1002', 'O1003', 'O1004', 'O1005', 'O1006', 'O1007', 'O1008', 'O1009', 'O1010'],
        'id_cliente': ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008', 'C009', 'C010'],
        'fecha_pedido': [
            '2026-08-01', 
            '2026-08-02', 
            '2026-08-02', 
            '2026-08-03', 
            '2026-08-04', 
            '2026-08-05', 
            '2026-08-05', 
            'CORRUPT-DATE',  # String date corrupt to test errors='coerce' in read_excel / to_datetime
            '2026-08-07', 
            '2026-08-08'
        ],
        'fecha_envio': [
            '2026-08-03', 
            '2026-08-01',  # ANOMALY: shipment BEFORE order date (2026-08-01 < 2026-08-02)
            '2026-08-04', 
            '2026-08-05', 
            '2026-08-06', 
            '2026-08-08', 
            '2026-08-04',  # ANOMALY: shipment BEFORE order date (2026-08-04 < 2026-08-05)
            '2026-08-09', 
            '2026-08-10', 
            '2026-08-11'
        ],
        'precio_unitario': [15.50, 10.00, 250.00, 5.00, 120.00, 45.00, 15.50, 30.00, 99.99, 15.00],
        'cantidad': [2, 5, 1, 10, 3, 2, 4, 1, 2, 3],
        'monto_total': [
            '31.00', 
            '50.00', 
            '250.00', 
            '50.00', 
            '360.00', 
            '90.00', 
            '45.00',  # ANOMALY: price * qty is 15.5 * 4 = 62.00, but total listed as 45.00
            'CORRUPT-AMOUNT',  # String amount corrupt to test errors='coerce' in to_numeric
            '199.98', 
            '45.00'
        ]
    }
    
    df = pd.DataFrame(data)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save using openpyxl as engine
    df.to_excel(output_path, index=False, sheet_name='Sheet1')
    print(f"Dataset excel guardado exitosamente en: {output_path}")

if __name__ == "__main__":
    target_excel = r"C:\Users\ianache\Desktop\DATA\01-DOCUMENTOS\02-PROYECTOS\112-skillvault\PY-101\ordenes_compra.xlsx"
    generate_excel_dataset(target_excel)
