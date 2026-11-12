import lxml.etree as ET

def verify():
    print("Loading data/content.xml...")
    tree = ET.parse('data/content.xml')

    # Assertion A
    print("\n=== Running Assertion A ===")
    comm_a = tree.xpath("//verse[@id='RAM_k02_S050_V023']//commentary")[0]
    id_a = comm_a.get('id')
    raw_text_a = comm_a.find('raw_text').text
    text_a = comm_a.find('text').text
    print('ID:', id_a)
    print('raw_text:', repr(raw_text_a))
    print('text:', repr(text_a))
    assert id_a == 'RAM_k02_S050_V023_B001', f"Expected id RAM_k02_S050_V023_B001, got {id_a}"
    assert 'देवराजानस्ते' in raw_text_a, "Missing देवराजानस्ते in raw_text!"
    assert 'देवराजानस्ते' in text_a, "Missing देवराजानस्ते in text!"
    assert 'div>' not in raw_text_a, "div> still in raw_text!"
    assert 'div>' not in text_a, "div> still in text!"
    print("Assertion A: PASSED")

    # Assertion B
    print("\n=== Running Assertion B ===")
    comm_b = tree.xpath("//commentary[@id='RAM_k01_S023_V002_B001']/text")[0]
    text_b = comm_b.text
    print('Snippet around daivam:', text_b[text_b.find('दैव'):text_b.find('दैव')+35])
    assert 'ंं' not in text_b, "Double anusvara still present in commentary text!"
    print("Assertion B: PASSED")

    # Assertion C
    print("\n=== Running Assertion C ===")
    double_anusvaras = tree.xpath("//text[contains(text(), '\u0902\u0902')]")
    print('Count of double anusvaras across all <text> nodes in XML:', len(double_anusvaras))
    assert len(double_anusvaras) == 0, f"Found {len(double_anusvaras)} double anusvaras!"
    print("Assertion C: PASSED")

    print("\nALL THREE VERIFICATION ASSERTIONS PASSED PERFECTLY!")

if __name__ == '__main__':
    verify()
