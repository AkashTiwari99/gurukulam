import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';
import styles from '../styles/home.module.css';

export default function Home() {
    return (
        <Layout>
            <Head>
                <title>Gurukulam | Reviving Ancient Wisdom</title>
            </Head>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.overlay}></div>
                <div className={`container ${styles['hero-container']}`}>
                    <div className={styles['hero-content']}>
                        <h1 className={styles['hero-title']}>Ancient Wisdom for Modern Times</h1>
                        <p className={styles['hero-subtitle']}>Uncover the eternal teachings of the Vedas, Ramayana, and Yoga, offering guidance for today&apos;s challenges.</p>
                        <div className={styles['hero-buttons']}>
                            <Link href="/programs" className="btn btn-primary">Explore Programs</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Content */}
            <section className={styles.features}>
                <div className="container">
                    <div className={styles['section-header']}>
                        <h2>Our Core Teachings</h2>
                        <p>Bridging ancient knowledge with contemporary challenges</p>
                    </div>
                    <div className={styles['card-container']}>
                        <div className={`${styles.card} glass-panel`}>
                            <div className={styles['card-image']}>
                                <img src="/images/card4.jpg" alt="Vedic Wisdom" width={257} height={196} loading="lazy" />
                                <div className={styles['card-badge']}>Featured</div>
                            </div>
                            <div className={styles['card-content']}>
                                <h3>Vedic Wisdom</h3>
                                <p>Explore the ancient scriptures and their practical applications in modern life.</p>
                                <Link href="/books" className="btn-link">
                                    Learn More <i className="fas fa-arrow-right" aria-hidden="true"></i>
                                </Link>
                            </div>
                        </div>
                        <div className={`${styles.card} glass-panel`}>
                            <div className={styles['card-image']}>
                                <img src="/images/card3.jpg" alt="Gurukul System" width={310} height={162} loading="lazy" />
                            </div>
                            <div className={styles['card-content']}>
                                <h3>Gurukul System</h3>
                                <p>Experience the traditional residential education model.</p>
                                <Link href="/about" className="btn-link">
                                    Discover <i className="fas fa-arrow-right" aria-hidden="true"></i>
                                </Link>
                            </div>
                        </div>
                        <div className={`${styles.card} glass-panel`}>
                            <div className={styles['card-image']}>
                                <img src="/images/card2.jpg" alt="Ramayana" width={216} height={234} loading="lazy" />
                            </div>
                            <div className={styles['card-content']}>
                                <h3>Ramayana</h3>
                                <p>Learn the timeless lessons from the epic Ramayana.</p>
                                <Link href="/books" className="btn-link">
                                    Read More <i className="fas fa-arrow-right" aria-hidden="true"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Programs Preview */}
            <section className={styles['programs-preview']}>
                <div className="container">
                    <div className={styles['section-header']}>
                        <h2>Featured Programs</h2>
                        <p>Transform your understanding through our specialized courses</p>
                    </div>
                    <div className={styles['programs-grid']}>
                        <div className={styles['program-card']}>
                            <div className={styles['program-icon']}>
                                <i className="fas fa-book-open" aria-hidden="true"></i>
                            </div>
                            <h3>Sanskrit Studies</h3>
                            <p>Learn the ancient language that connects us to our roots.</p>
                            <Link href="/programs" className="btn-outline">Explore</Link>
                        </div>
                        <div className={`${styles['program-card']} ${styles.featured}`}>
                            <div className={styles['program-icon']}>
                                <i className="fas fa-pray" aria-hidden="true"></i>
                            </div>
                            <h3>Yoga &amp; Meditation</h3>
                            <p>Discover inner peace and physical harmony.</p>
                            <Link href="/programs" className="btn-outline">Explore</Link>
                        </div>
                        <div className={styles['program-card']}>
                            <div className={styles['program-icon']}>
                                <i className="fas fa-om" aria-hidden="true"></i>
                            </div>
                            <h3>Vedic Philosophy</h3>
                            <p>Dive deep into the philosophical aspects of Vedic teachings.</p>
                            <Link href="/programs" className="btn-outline">Explore</Link>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
