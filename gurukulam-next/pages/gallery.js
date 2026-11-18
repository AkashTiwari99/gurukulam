import Head from 'next/head';
import Layout from '../components/Layout';
import { useState } from 'react';
import styles from '../styles/gallery.module.css';

export default function Gallery() {
    const [filter, setFilter] = useState('photos');

    const images = [
        { src: "/images/BG Recitation _0.jpg", alt: "BG Recitation", width: 762, height: 563 },
        { src: "/images/card1.jpg", alt: "Gallery Image 1", width: 318, height: 159 },
        { src: "/images/card2.jpg", alt: "Gallery Image 2", width: 216, height: 234 },
        { src: "/images/card3.jpg", alt: "Gallery Image 3", width: 310, height: 162 },
        { src: "/images/card4.jpg", alt: "Gallery Image 4", width: 257, height: 196 },
        { src: "/images/card5.jpg", alt: "Gallery Image 5", width: 600, height: 450 },
        { src: "/images/card6-1080.webp", alt: "Gallery Image 6", width: 1080, height: 610 },
        { src: "/images/fire.webp", alt: "Fire Ritual", width: 1200, height: 808 },
    ];

    return (
        <Layout>
            <Head>
                <title>Gallery | Gurukulam</title>
            </Head>

            <div className="container" style={{ marginTop: '2rem', textAlign: 'center' }}>
                <h1>Gallery</h1>
                <p>Glimpses of life at Gurukulam</p>
            </div>

            {/* Filter Buttons */}
            <div className={styles['filter-buttons']}>
                <button
                    type="button"
                    className={filter === 'photos' ? styles.active : ''}
                    onClick={() => setFilter('photos')}
                >
                    Photos
                </button>
                <button
                    type="button"
                    className={filter === 'videos' ? styles.active : ''}
                    onClick={() => setFilter('videos')}
                >
                    Videos
                </button>
            </div>

            {/* Gallery Grid */}
            <section id="gallery" className={`${styles['gallery-section']} container`}>
                {filter === 'photos' ? (
                    <div className={styles['gallery-grid']} id="gallery-grid">
                        {images.map((img, index) => (
                            <div key={index} className={styles['gallery-item']}>
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    width={img.width}
                                    height={img.height}
                                    loading={index >= 2 ? 'lazy' : undefined}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles['gallery-grid']} style={{ textAlign: 'center', display: 'block' }}>
                        <p>No videos available at the moment.</p>
                    </div>
                )}
            </section>
        </Layout>
    );
}
