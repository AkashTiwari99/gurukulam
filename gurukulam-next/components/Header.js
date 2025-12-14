import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Header() {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => router.pathname === path ? 'current-page' : '';

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container header-container">
                {/* Logo */}
                <Link href="/" className="logo">
                    <div className="logo-circle">
                        <span>GURU</span>
                    </div>
                    <div className="logo-text">
                        <span className="logo-main">Gurukulam</span>
                        <span className="logo-tagline">Reviving Ancient Wisdom</span>
                    </div>
                </Link>

                {/* Hamburger Menu for Mobile */}
                <div
                    className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                {/* Navigation */}
                <nav className={`navbar ${isMobileMenuOpen ? 'active' : ''}`} id="navbar">
                    <ul className="nav-list">
                        <li><Link href="/" className={isActive('/')}>Home</Link></li>
                        <li className="has-dropdown">
                            <a href="#" onClick={(e) => { e.preventDefault(); }}>Programs <i className="fas fa-chevron-down"></i></a>
                            <div className="dropdown-content">
                                <Link href="/programs">Vedic Studies</Link>
                                <Link href="/sanatan-dharma">Sanskrit Immersion</Link>
                                <Link href="/programs">Yoga & Meditation</Link>
                                <Link href="/programs">Ayurveda Basics</Link>
                            </div>
                        </li>
                        <li><Link href="/books" className={isActive('/books')}>Books</Link></li>
                        <li><Link href="/campus" className={isActive('/campus')}>Campus</Link></li>
                        <li><Link href="/gallery" className={isActive('/gallery')}>Gallery</Link></li>
                        <li className="has-dropdown">
                            <a href="#" onClick={(e) => { e.preventDefault(); }}>About <i className="fas fa-chevron-down"></i></a>
                            <div className="dropdown-content">
                                <Link href="/about">About Us</Link>
                                <Link href="/mission">Our Mission</Link>
                                <Link href="/team">Our Team</Link>
                            </div>
                        </li>
                        <li><Link href="/contact" className={isActive('/contact')}>Contact</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
