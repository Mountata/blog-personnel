import { useState } from 'react';

const PhotoGrid = ({ images }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!images || images.length === 0) return null;

  const getUrl = (img) => `http://localhost:5000${img}`;

  return (
    <>
      {/* Grille photos */}
      <div className="overflow-hidden">

        {/* 1 photo */}
        {images.length === 1 && (
          <img
            src={getUrl(images[0])}
            onClick={() => setSelectedPhoto(images[0])}
            className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition"
          />
        )}

        {/* 2 photos */}
        {images.length === 2 && (
          <div className="grid grid-cols-2 gap-0.5">
            {images.map((img, i) => (
              <img
                key={i}
                src={getUrl(img)}
                onClick={() => setSelectedPhoto(img)}
                className="h-64 w-full object-cover cursor-pointer hover:opacity-95 transition"
              />
            ))}
          </div>
        )}

        {/* 3 photos */}
        {images.length === 3 && (
          <div className="grid grid-cols-2 gap-0.5">
            <img
              src={getUrl(images[0])}
              onClick={() => setSelectedPhoto(images[0])}
              className="h-64 w-full object-cover cursor-pointer hover:opacity-95 transition row-span-2"
            />
            <img
              src={getUrl(images[1])}
              onClick={() => setSelectedPhoto(images[1])}
              className="h-32 w-full object-cover cursor-pointer hover:opacity-95 transition"
            />
            <img
              src={getUrl(images[2])}
              onClick={() => setSelectedPhoto(images[2])}
              className="h-32 w-full object-cover cursor-pointer hover:opacity-95 transition"
            />
          </div>
        )}

        {/* 4 photos */}
        {images.length === 4 && (
          <div className="grid grid-cols-2 gap-0.5">
            {images.map((img, i) => (
              <img
                key={i}
                src={getUrl(img)}
                onClick={() => setSelectedPhoto(img)}
                className="h-48 w-full object-cover cursor-pointer hover:opacity-95 transition"
              />
            ))}
          </div>
        )}

        {/* 5+ photos */}
        {images.length >= 5 && (
          <div className="grid grid-cols-2 gap-0.5">
            <img
              src={getUrl(images[0])}
              onClick={() => setSelectedPhoto(images[0])}
              className="h-48 w-full object-cover cursor-pointer hover:opacity-95 transition col-span-2"
            />
            {images.slice(1, 4).map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={getUrl(img)}
                  onClick={() => setSelectedPhoto(img)}
                  className={`h-32 w-full object-cover cursor-pointer hover:opacity-95 transition
                    ${i === 2 && images.length > 5 ? 'opacity-60' : ''}`}
                />
                {i === 2 && images.length > 5 && (
                  <div
                    onClick={() => setSelectedPhoto(img)}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  >
                    <span className="text-white text-3xl font-bold">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox — voir photo en grand */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={getUrl(selectedPhoto)}
            className="max-w-full max-h-full object-contain rounded"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

export default PhotoGrid;