// HomeButton.tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface HomeButtonProps {
  position: [number, number] | null;
}

const HomeButton: React.FC<HomeButtonProps> = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    const HomeControl = L.Control.extend({
      onAdd: function () {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.style.backgroundColor = 'white';
        div.style.width = '40px';
        div.style.height = '40px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.cursor = 'pointer';
        div.style.borderRadius = '4px';
        div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.65)';

        // Menggunakan SVG untuk ikon rumah
        div.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="#000000">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        `;

        div.onclick = () => {
          map.setView(position, 13, { animate: true });
        };

        return div;
      }
    });

    const homeControl = new HomeControl({ position: 'bottomright' });
    homeControl.addTo(map);

    return () => {
      homeControl.remove();
    };
  }, [map, position]);

  return null;
};

export default HomeButton;
