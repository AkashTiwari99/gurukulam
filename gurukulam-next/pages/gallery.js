import Head from 'next/head';
import Layout from '../components/Layout';
import { useState } from 'react';

export default function Gallery() {
    const [filter, setFilter] = useState('photos');

    const images = [
        { src: "/images/BG Recitation _0.jpg", alt: "BG Recitation" },
        { src: "/images/card1.jpg", alt: "Gallery Image 1" },
        { src: "/images/card2.jpg", alt: "Gallery Image 2" },
        { src: "/images/card3.jpg", alt: "Gallery Image 3" },
        { src: "/images/card4.jpg", alt: "Gallery Image 4" },
        { src: "/images/card5.jpg", alt: "Gallery Image 5" },
        { src: "/images/card6.jpg", alt: "Gallery Image 6" },
        { src: "/images/fire.jpg", alt: "Fire Ritual" },
    ];

    return (
        <Layout>
            <Head>
                <title>Gallery | Gurukulam</title>
            </Head>

            {/* Header (reusing global header styles or simple container) */}
            <div className="container" style={{ marginTop: '2rem', textAlign: 'center' }}>
                <h1>Gallery</h1>
                <p>Glimpses of life at Gurukulam</p>
            </div>

            {/* Filter Buttons */}
            <div className="filter-buttons">
                <button
                    className={filter === 'photos' ? 'active' : ''}
                    onClick={() => setFilter('photos')}
                >
                    Photos
                </button>
                <button
                    className={filter === 'videos' ? 'active' : ''}
                    onClick={() => setFilter('videos')}
                >
                    Videos
                </button>
            </div>

            {/* Gallery Grid */}
            <section id="gallery" className="gallery-section container">
                {filter === 'photos' ? (
                    <div className="gallery-grid" id="gallery-grid">
                        {images.map((img, index) => (
                            <div key={index} className="gallery-item">
                                <img src={img.src} alt={img.alt} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="gallery-grid" style={{ textAlign: 'center', display: 'block' }}>
                        <p>No videos available at the moment.</p>
                    </div>
                )}
            </section>
        </Layout>
    );
}
