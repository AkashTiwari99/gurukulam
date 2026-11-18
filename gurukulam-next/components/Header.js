import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Header() {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
    }, [router.asPath]);

    const closeMenus = () => {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
    };

    const toggleDropdown = (name) => {
        setOpenDropdown((prev) => (prev === name ? null : name));
    };

    const isActive = (path) => (router.pathname === path ? 'current-page' : '');

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container header-container">
                {/* Logo */}
                <Link href="/" className="logo" onClick={closeMenus}>
                    <div className="logo-circle">
                        <span>GURU</span>
                    </div>
                    <div className="logo-text">
                        <span className="logo-main">Gurukulam</span>
                        <span className="logo-tagline">Reviving Ancient Wisdom</span>
                    </div>
                </Link>

                {/* Hamburger Menu for Mobile */}
                <button
                    type="button"
                    className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                    aria-label="Toggle menu"
                    aria-expanded={isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Navigation */}
                <nav className={`navbar ${isMobileMenuOpen ? 'active' : ''}`} id="navbar">
                    <ul className="nav-list">
                        <li>
                            <Link
                                href="/"
                                className={isActive('/')}
                                aria-current={router.pathname === '/' ? 'page' : undefined}
                                onClick={closeMenus}
                            >
                                Home
                            </Link>
                        </li>
                        <li className={`has-dropdown ${openDropdown === 'programs' ? 'active' : ''}`}>
                            <button
                                type="button"
                                className="nav-dropdown-btn"
                                aria-haspopup="true"
                                aria-expanded={openDropdown === 'programs'}
                                onClick={() => toggleDropdown('programs')}
                            >
                                Programs <i className="fas fa-chevron-down" aria-hidden="true"></i>
                            </button>
                            <div className="dropdown-content">
                                <Link href="/programs" onClick={closeMenus}>Vedic Studies</Link>
                                <Link href="/programs" onClick={closeMenus}>Sanskrit Immersion</Link>
                                <Link href="/programs" onClick={closeMenus}>Yoga &amp; Meditation</Link>
                                <Link href="/programs" onClick={closeMenus}>Ayurveda Basics</Link>
                            </div>
                        </li>
                        <li>
                            <Link
                                href="/books"
                                className={isActive('/books')}
                                aria-current={router.pathname === '/books' ? 'page' : undefined}
                                onClick={closeMenus}
                            >
                                Books
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/campus"
                                className={isActive('/campus')}
                                aria-current={router.pathname === '/campus' ? 'page' : undefined}
                                onClick={closeMenus}
                            >
                                Campus
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/gallery"
                                className={isActive('/gallery')}
                                aria-current={router.pathname === '/gallery' ? 'page' : undefined}
                                onClick={closeMenus}
                            >
                                Gallery
                            </Link>
                        </li>
                        <li className={`has-dropdown ${openDropdown === 'about' ? 'active' : ''}`}>
                            <button
                                type="button"
                                className="nav-dropdown-btn"
                                aria-haspopup="true"
                                aria-expanded={openDropdown === 'about'}
                                onClick={() => toggleDropdown('about')}
                            >
                                About <i className="fas fa-chevron-down" aria-hidden="true"></i>
                            </button>
                            <div className="dropdown-content">
                                <Link href="/about" onClick={closeMenus}>About Us</Link>
                                <Link href="/mission" onClick={closeMenus}>Our Mission</Link>
                                <Link href="/team" onClick={closeMenus}>Our Team</Link>
                            </div>
                        </li>
                        <li>
                            <Link
                                href="/contact"
                                className={isActive('/contact')}
                                aria-current={router.pathname === '/contact' ? 'page' : undefined}
                                onClick={closeMenus}
                            >
                                Contact
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
