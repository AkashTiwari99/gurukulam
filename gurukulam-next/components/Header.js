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
        <header class={`header ${isScrolled ? 'scrolled' : ''}`}>
            <div class="container header-container">
                {/* Logo */}
                <Link href="/" class="logo">
                    <div class="logo-circle">
                        <span>GURU</span>
                    </div>
                    <div class="logo-text">
                        <span class="logo-main">Gurukulam</span>
                        <span class="logo-tagline">Reviving Ancient Wisdom</span>
                    </div>
                </Link>

                {/* Hamburger Menu for Mobile */}
                <div
                    class={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                {/* Navigation */}
                <nav class={`navbar ${isMobileMenuOpen ? 'active' : ''}`} id="navbar">
                    <ul class="nav-list">
                        <li><Link href="/" class={isActive('/')}>Home</Link></li>
                        <li><Link href="/programs" class={isActive('/programs')}>Programs</Link></li>
                        <li><Link href="/books" class={isActive('/books')}>Books</Link></li>
                        <li><Link href="/campus" class={isActive('/campus')}>Campus</Link></li>
                        <li><Link href="/gallery" class={isActive('/gallery')}>Gallery</Link></li>
                        <li class="has-dropdown">
                            <a href="#" onClick={(e) => { e.preventDefault(); }}>About <i class="fas fa-chevron-down"></i></a>
                            <div class="dropdown-content">
                                <Link href="/about">About Us</Link>
                                <Link href="/mission">Our Mission</Link>
                                <Link href="/team">Our Team</Link>
                            </div>
                        </li>
                        <li><Link href="/contact" class={isActive('/contact')}>Contact</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
