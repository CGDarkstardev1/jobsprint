import sys
from bs4 import BeautifulSoup

def parse_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')
    
    print(f"--- Analysis of {filename} ---")
    
    # Title and Meta
    title = soup.title.string if soup.title else "No Title"
    print(f"Title: {title}")
    
    # Features (Look for common sections)
    print("\n[Features / How it works]")
    for section in soup.find_all(['section', 'div'], id=['features', 'how-it-works']):
        print(section.get_text(strip=True, separator='\n'))
        
    # Pricing
    print("\n[Pricing]")
    pricing_section = soup.find(['section', 'div'], id='pricing')
    if pricing_section:
        print(pricing_section.get_text(strip=True, separator='\n'))
    else:
        # Fallback search for price symbols
        prices = soup.find_all(string=lambda t: '$' in t)
        for p in prices:
            parent = p.parent
            if parent:
                print(parent.get_text(strip=True))

    # Testimonials
    print("\n[Testimonials]")
    for section in soup.find_all(['section', 'div'], id=['testimonials', 'success']):
        print(section.get_text(strip=True, separator='\n'))

    # Footer
    print("\n[Footer]")
    footer = soup.find('footer')
    if footer:
        print(footer.get_text(strip=True, separator='\n'))
    else:
        # Search for common footer keywords
        for div in soup.find_all('div', class_=lambda c: c and 'footer' in c.lower()):
            print(div.get_text(strip=True, separator='\n'))

    # Links
    print("\n[Important Links]")
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text(strip=True)
        if any(keyword in href.lower() or keyword in text.lower() for keyword in ['chrome', 'extension', 'privacy', 'terms', 'about', 'blog', 'support']):
            print(f"{text}: {href}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        parse_file(sys.argv[1])
