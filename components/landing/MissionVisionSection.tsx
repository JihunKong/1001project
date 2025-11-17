'use client';

export default function MissionVisionSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-[1240px] px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <div
              className="px-6 py-2 rounded-full"
              style={{
                background: '#FAFAFA'
              }}
            >
              <span
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#2B2B2B'
                }}
              >
                EMPOWER YOUNG VOICE
              </span>
            </div>
          </div>

          <h2
            className="max-w-[1240px]"
            style={{
              fontFamily: 'Poppins',
              fontSize: '40px',
              fontWeight: 600,
              lineHeight: '1.2'
            }}
          >
            <span
              style={{
                background: 'linear-gradient(90deg, #04A59D 0%, #91C549 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Where Every Smile Has a Story :{' '}
            </span>
            <span style={{ color: '#2B2B2B' }}>
              Where Stories Become Learning, and Learning Becomes Stories.
            </span>
          </h2>
        </div>

        {/* Two Columns */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* About Us */}
          <div className="space-y-4">
            <h3
              style={{
                fontFamily: 'Quicksand',
                fontSize: '20px',
                fontWeight: 700,
                color: '#04A59D'
              }}
            >
              About Us
            </h3>
            <p
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 400,
                color: '#2B2B2B',
                lineHeight: '2em'
              }}
            >
              Our mobile storytelling program, 1001 Stories, brings meaningful learning to some of the hardest to reach populations around the world. We aim to facilitate the creation, development, and gathering of 1001 empowering stories from every participating local community.
            </p>
          </div>

          {/* Our Vision */}
          <div className="space-y-4">
            <h3
              style={{
                fontFamily: 'Quicksand',
                fontSize: '20px',
                fontWeight: 700,
                color: '#04A59D'
              }}
            >
              Our Vision
            </h3>
            <p
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 400,
                color: '#2B2B2B',
                lineHeight: '2em'
              }}
            >
              We believe every child carries the spark of an Einstein. Books inspire learning, and learning awakens potential. Our vision is a world where every child has access to education — a place where imagination can grow without limits.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
