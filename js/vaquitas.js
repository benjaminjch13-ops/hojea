// La colección: 100 vaquitas temáticas con su escena, y la regla que decide cuál gana cada cita.
// Las escenas usan un lienzo de 120×120; los accesorios, las coordenadas de la cara de Muu (100×92).
import { MUU_COLORS, MUU_PINK, fluffyHead, muuBodyColors, muuBreedHead, muuSittingInner, sittingFigure } from './cow.js';
import { circle, daisy, dots, glasses, heart, line, path, rect, star, sunglasses } from './vaquita-art.js';
import { MORE_VAQUITAS } from './vaquitas-series.js';

const HOLSTEIN = {
  colors: { dark: '#3a2c27', muzzle: '#f6c6cf', muzzleTop: '#fbdde2', feature: '#a5606f' },
  spots: `${path('M27 40c-5 8-3 19 6 22 9 2 14-6 11-15-2-7-11-13-17-7z', '#3a2c27')}${path('M72 56c6 3 7 11 2 15-6 1-10-4-9-9 0-3 3-6 7-6z', '#3a2c27')}`,
};

export const VAQUITAS = [
  {
    id: 'astronauta', name: 'Astro Muu', theme: 'En el espacio', fur: '#b8703a',
    bg: `${rect(0, 0, 120, 120, '#1B2145')}
      ${dots([[12, 16], [30, 8], [52, 20], [84, 10], [106, 26], [10, 52], [112, 60], [24, 34, 1.4], [70, 6, 1.4], [100, 44, 0.8], [8, 80, 0.8]], '#fff')}
      ${circle(96, 24, 13, '#F2A65A')}${line('M78 30c10-6 28-9 36-6', '#F9D9A8', 2.5)}
      ${path('M0 120v-20c20-10 96-12 120 0v20z', '#8E93B0')}${circle(20, 112, 4, '#747A99')}${circle(100, 110, 5, '#747A99')}`,
    acc: `<circle cx="50" cy="48" r="55" fill="#BFE3FF" fill-opacity=".16" stroke="#E8ECF4" stroke-width="5"/>
      ${line('M15 30C22 14 34 7 46 6', '#fff', 3.5)}`,
  },
  {
    id: 'vaquera', name: 'Vaquera Lola', theme: 'En el desierto', fur: '#dcb074',
    bg: `${rect(0, 0, 120, 120, '#F9C37B')}${rect(0, 0, 120, 34, '#F58F5C')}${circle(92, 38, 15, '#FFE27A')}
      ${path('M0 74l10-22h28l8 22zM78 78l6-18h26l8 18z', '#B5533C')}${rect(0, 76, 120, 44, '#E6A65D')}
      ${path('M12 104V76c0-5 7-5 7 0v28zM5 90v-8c0-3 4-3 4 0v5h3v5H7c-1 0-2-1-2-2zM26 84v-6c0-3-4-3-4 0v3h-3v5h5c1 0 2-1 2-2z', '#4F8A4C')}
      ${path('M104 108V86c0-4 6-4 6 0v22z', '#4F8A4C')}`,
    acc: `${path('M28 82l22 18 22-18c-12 6-32 6-44 0z', '#D7263D')}${dots([[40, 87], [50, 91], [60, 87]], '#fff', 1.2)}
      ${path('M30 25C29 7 39-2 50 4c11-6 21 3 20 21z', '#A06A3C')}${path('M30 22c12 4 28 4 40 0v6c-12 4-28 4-40 0z', '#E4572E')}
      ${path('M2 21c15 11 81 11 96 0-5 13-24 19-48 19S7 34 2 21z', '#8A5A33')}`,
  },
  {
    id: 'capitana', name: 'Capitana Muu', theme: 'En alta mar', fur: '#9a4f2c',
    bg: `${rect(0, 0, 120, 120, '#BFE6F2')}${circle(100, 20, 10, '#FFDD6E')}
      ${path('M6 42c10-6 18-6 24 0zM66 26c8-5 16-5 22 0z', '#fff')}
      ${path('M92 54h20l-4 10H96zM101 54V30l10 16z', '#7A4A2B')}${path('M101 32l-11 15h11z', '#fff')}
      ${rect(0, 64, 120, 56, '#2F7F9E')}${line('M0 76q10-7 20 0t20 0 20 0 20 0 20 0 20 0M0 96q10-7 20 0t20 0 20 0 20 0 20 0 20 0', '#7CC6DB', 2.5)}`,
    acc: `${path('M12 31C20 3 80 3 88 31 72 22 28 22 12 31z', '#2A2430')}${line('M15 30C30 20 70 20 85 30', '#F2C14E', 2.5)}
      ${circle(50, 15, 5, '#fff')}${line('M43 23l14-4M43 19l14 4', '#fff', 1.6)}${circle(48, 14, 0.9, '#2A2430')}${circle(52, 14, 0.9, '#2A2430')}
      ${line('M28 43L74 60', '#1F1A1C', 2.2)}${circle(63, 56, 7.5, '#1F1A1C')}`,
  },
  {
    id: 'chef', name: 'Chef Muuriel', theme: 'En la cocina', fur: '#efe7da',
    bg: `${rect(0, 0, 120, 120, '#FFF1DC')}
      ${[0, 24, 48, 72, 96].map((x, i) => rect(x, i % 2 ? 0 : 24, 24, 24, '#F8DDB9')).join('')}${[12, 36, 60, 84, 108].map((x, i) => rect(x - 12, i % 2 ? 48 : 72, 24, 24, '#F8DDB9')).join('')}
      ${rect(4, 12, 22, 3, '#8A5A33')}${path('M8 12c0-6 6-6 6 0zM16 12c0-8 8-8 8 0z', '#E4572E')}
      ${rect(92, 16, 24, 3, '#8A5A33')}${path('M97 16v-8h7v8zM106 16v-6h6v6z', '#5FA8A0')}
      ${rect(0, 100, 120, 20, '#C8813F')}`,
    acc: `${path('M28 30c-14-3-16-22 2-24 3-12 20-13 24-4 10-7 24-1 21 9 13 3 10 20-3 19z', '#fff', 'stroke="#E5DDD0" stroke-width="1.5"')}
      ${path('M28 24c14 4 30 4 44 0v8c-14 4-30 4-44 0z', '#F4EFE6')}${line('M38 12v9M50 8v13M62 12v9', '#E5DDD0', 1.5)}
      ${path('M32 90l18 4 18-4v9l-18-4-18 4z', '#D7263D')}${circle(50, 94, 3, '#A81D2F')}`,
  },
  {
    id: 'playera', name: 'Muu Playera', theme: 'En la playa', fur: '#b8703a',
    bg: `${rect(0, 0, 120, 120, '#8EDBF2')}${circle(22, 22, 13, '#FFD23F')}
      ${rect(0, 66, 120, 20, '#29B6C9')}${line('M0 72q8-4 16 0t16 0 16 0 16 0 16 0 16 0 16 0 16 0', '#BDEFF5', 2)}
      ${path('M0 120V84c30-6 90-6 120 0v36z', '#F6DFA3')}
      ${path('M103 90c-2-16 0-30 3-42l4 1c-3 12-4 26-2 41z', '#8A5A33')}${path('M108 48c-10-8-20-6-24 2 8-3 16-3 24-2zM108 48c-2-12-12-16-20-12 8 2 14 6 20 12zM108 48c4-11 14-13 20-8-8 1-14 3-20 8z', '#3F9142')}`,
    acc: `${sunglasses()}
      ${Array.from({ length: 5 }, (_, i) => { const a = (i * 2 * Math.PI) / 5; return circle((80 + Math.cos(a) * 6).toFixed(1), (30 + Math.sin(a) * 6).toFixed(1), 5, '#F2577F'); }).join('')}${circle(80, 30, 2.5, '#FFD23F')}`,
  },
  {
    id: 'barista', name: 'Barista Canela', theme: 'En la cafetería', fur: '#c78a52',
    bg: `${rect(0, 0, 120, 120, '#7B553B')}${rect(8, 8, 34, 28, '#FBE3B5', 'rx="3"')}${line('M25 8v28M8 22h34', '#7B553B', 2)}
      ${rect(76, 20, 40, 3, '#3E2A1D')}${path('M80 20v-9h7v9zM90 20v-12h7v12zM100 20v-7h9v7z', '#E9C9A0')}
      ${rect(76, 44, 40, 3, '#3E2A1D')}${path('M80 44v-8h9v8zM93 44v-11h7v11zM103 44v-7h9v7z', '#C9A06F')}
      ${rect(0, 102, 120, 18, '#3E2A1D')}`,
    acc: `${path('M24 28c-3-20 12-28 26-28s29 8 26 28c-16-6-36-6-52 0z', '#4C3323')}${path('M16 30c18-8 50-8 68 0-2 4-4 5-6 5-16-5-40-5-56 0-2 0-4-1-6-5z', '#3E2A1D')}
      ${rect(74, 74, 20, 19, '#FFF8EF', 'rx="3"')}${line('M94 79c7-1 7 10 0 9', '#FFF8EF', 3)}${rect(77, 77, 14, 4, '#6B4226')}
      ${line('M79 70c-3-3 3-5 0-9M87 70c-3-3 3-5 0-9', '#FFF8EF', 2)}`,
  },
  {
    id: 'maga', name: 'Maga Luna', theme: 'En la noche mágica', fur: '#a7a09a',
    bg: `${rect(0, 0, 120, 120, '#3B2A6B')}${path('M98 14a14 14 0 1 0 10 24 12 12 0 0 1-10-24z', '#FFE27A')}
      ${star(16, 20, 4, '#FFE27A')}${star(36, 10, 2.5, '#fff')}${star(10, 52, 2.5, '#fff')}${star(108, 62, 3, '#fff')}
      ${path('M0 120V98c20-8 34-4 50 0s46 4 70-4v26z', '#251A4A')}`,
    acc: `${path('M28 28L58-30c4 18 13 42 16 58z', '#2A1C52')}${path('M27 22c15 5 32 5 48 0l1 8c-16 5-34 5-50 0z', '#F2C14E')}
      ${star(53, 6, 5, '#F2C14E')}${star(61, -12, 3, '#fff')}
      ${path('M4 26c16 9 76 9 92 0-6 11-24 15-46 15S10 37 4 26z', '#1F143F')}`,
  },
  {
    id: 'rockera', name: 'Rockera Muu', theme: 'En el escenario', fur: '#4d3a33',
    bg: `${rect(0, 0, 120, 120, '#2B1B3D')}
      ${path('M18 0l-16 90h34zM60 0L44 90h32zM102 0L84 90h34z', '#F2577F', 'opacity=".28"')}${path('M40 0L24 90h34zM82 0L66 90h34z', '#6FD6FF', 'opacity=".22"')}
      ${rect(2, 66, 20, 36, '#141018', 'rx="2"')}${circle(12, 78, 6, '#3A3340')}${circle(12, 94, 4, '#3A3340')}
      ${rect(98, 66, 20, 36, '#141018', 'rx="2"')}${circle(108, 78, 6, '#3A3340')}${circle(108, 94, 4, '#3A3340')}
      ${rect(0, 102, 120, 18, '#17101F')}`,
    acc: `${line('M15 52C12 2 88 2 85 52', '#F3F5FA', 5)}${rect(7, 44, 12, 22, '#F2577F', 'rx="5"')}${rect(81, 44, 12, 22, '#F2577F', 'rx="5"')}
      ${path('M30 60l6-8-1 6 5 0-6 8 1-6z', '#FFE27A')}`,
  },
  {
    id: 'buzo', name: 'Buzo Burbuja', theme: 'Bajo el mar', fur: '#efe7da',
    bg: `${rect(0, 0, 120, 120, '#1088B0')}${rect(0, 0, 120, 30, '#27A8CC')}
      ${path('M0 120v-14c30-6 90-6 120 0v14z', '#EBD9A0')}
      ${line('M10 110c-6-9 6-13 0-22s6-12 0-20', '#2E9E6B', 4)}${line('M110 110c6-9-6-13 0-22', '#2E9E6B', 4)}
      ${path('M92 30c8-7 16-7 20 0-4 7-12 7-20 0l-6-5v10z', '#FF9F43')}${circle(107, 29, 1.2, '#1F1A1C')}
      ${path('M12 42c6-4 11-4 14 0-3 4-8 4-14 0l-4-3v6z', '#FFD23F')}
      ${dots([[20, 18, 2.5], [30, 8, 1.5], [104, 54, 2.5], [112, 46, 1.5], [12, 60, 2]], '#D8F3FF')}`,
    acc: `${rect(23, 45, 54, 22, '#BFEFFF', 'rx="10" fill-opacity=".45" stroke="#FFC233" stroke-width="4"')}
      ${line('M23 52L10 44M77 52L90 44', '#2A2430', 4)}
      ${line('M86 72V24', '#F26B3A', 5)}${line('M86 72c0 8-8 10-16 8', '#F26B3A', 5)}`,
  },
  {
    id: 'artista', name: 'Artista Pincel', theme: 'En su estudio', fur: '#9a4f2c',
    bg: `${rect(0, 0, 120, 120, '#FDF0D5')}
      ${rect(6, 12, 28, 34, '#fff', 'stroke="#B98C5C" stroke-width="2"')}${circle(14, 24, 4, '#F2577F')}${circle(24, 32, 5, '#4FB3D9')}${path('M10 42c6-6 12-6 20 0z', '#7DBB5C')}
      ${line('M12 46L6 92M28 46l6 46', '#B98C5C', 3)}
      ${circle(100, 16, 5, '#F2C14E')}${circle(110, 30, 4, '#4FB3D9')}${circle(92, 32, 3, '#F2577F')}
      ${rect(0, 100, 120, 20, '#D8B98C')}`,
    acc: `${path('M18 26C22 6 80 2 86 24 70 34 32 36 18 26z', '#C1121F')}${line('M54 8l2-7', '#C1121F', 3)}
      ${path('M72 72c10-6 24-3 26 5 2 9-8 14-18 12-3-1-2-5-5-5s-8-7-3-12z', '#D9B382')}
      ${circle(80, 76, 2.4, '#F2577F')}${circle(88, 76, 2.4, '#4FB3D9')}${circle(93, 82, 2.4, '#F2C14E')}${circle(86, 85, 2.4, '#7DBB5C')}`,
  },
  {
    id: 'exploradora', name: 'Exploradora Selva', theme: 'En la selva', fur: '#b8703a',
    bg: `${rect(0, 0, 120, 120, '#BFE6C2')}
      ${path('M86 88V70h4V58h4V46h4V38h8v8h4v12h4v12h4v18z', '#A9A08C')}${rect(98, 30, 8, 8, '#8E856F')}
      ${circle(10, 34, 20, '#3F9142')}${circle(30, 22, 16, '#57A85A')}${circle(62, 18, 18, '#3F9142')}${circle(116, 14, 14, '#57A85A')}
      ${path('M0 120V88c40-6 80-6 120 0v32z', '#5B8C4A')}${path('M2 118c2-14 6-20 12-24M16 118c0-10 4-16 8-18', '#2F6F36', 'stroke="#2F6F36" stroke-width="3"')}`,
    acc: `${path('M24 26C24 2 76 2 76 26z', '#D9C08C')}${path('M24 22c16 3 36 3 52 0v5c-16 3-36 3-52 0z', '#8A5A33')}
      ${path('M6 25c20 9 68 9 88 0-6 9-22 12-44 12S12 34 6 25z', '#C9AE76')}
      ${rect(34, 88, 12, 12, '#2A2430', 'rx="3"')}${rect(54, 88, 12, 12, '#2A2430', 'rx="3"')}${rect(45, 91, 10, 4, '#2A2430')}${circle(40, 97, 3, '#6FD6FF')}${circle(60, 97, 3, '#6FD6FF')}`,
  },
  {
    id: 'esquiadora', name: 'Esquiadora Nieve', theme: 'En la nieve', fur: '#c78a52',
    bg: `${rect(0, 0, 120, 120, '#CFE8F5')}
      ${path('M0 90l26-50 26 50zM50 90l30-62 40 62z', '#F7FBFF')}${path('M26 40l-8 15 6-3 3 4 3-4 6 3zM80 28l-10 20 7-3 4 4 4-4 7 3z', '#9CC4DA')}
      ${path('M0 120V86c40-8 80-8 120 0v34z', '#fff')}
      ${path('M12 96l9-24 9 24zM100 100l9-24 9 24z', '#3F7F5F')}${rect(19, 96, 4, 7, '#8A5A33')}${rect(107, 100, 4, 7, '#8A5A33')}
      ${dots([[12, 12, 2], [40, 18, 1.5], [60, 8, 2], [100, 14, 1.5], [112, 38, 2], [6, 44, 1.5]], '#fff')}`,
    acc: `${path('M23 30C21 4 79 4 77 30z', '#E63946')}${path('M21 26c18 5 40 5 58 0v9c-18 5-40 5-58 0z', '#F3F5FA')}${line('M31 12l-1 13M42 7v18M58 7v18M69 12l1 13', '#B8202E', 2)}${circle(50, 3, 7, '#F3F5FA')}
      ${path('M22 86c16 9 40 9 56 0l2 8c-18 10-42 10-60 0z', '#E63946')}${path('M62 92l12 20-10 1-9-19z', '#E63946')}${line('M64 100l9-1', '#F3F5FA', 2)}`,
  },
  {
    id: 'super', name: 'Súper Muu', theme: 'Sobre la ciudad', fur: '#f5efe4', ...HOLSTEIN,
    bg: `${rect(0, 0, 120, 120, '#FF9A76')}${rect(0, 0, 120, 26, '#F2577F')}${circle(20, 26, 9, '#FFE27A')}
      ${path('M0 120V70h16V54h18v24h14V44h22v30h14V58h18v20h18v42z', '#4A3560')}
      ${[[20, 60], [28, 60], [54, 52], [62, 52], [54, 64], [62, 64], [90, 66], [98, 66], [8, 80], [40, 86], [108, 86], [76, 90]].map(([x, y]) => rect(x, y, 4, 5, '#FFE27A')).join('')}`,
    under: path('M14 60C-2 90 0 122 6 136h88c6-14 8-46-8-76z', '#D7263D'),
    acc: `${path('M23 50c8-9 20-7 27-2 7-5 19-7 27 2-1 13-16 16-27 9-11 7-26 4-27-9z', '#D7263D')}
      ${circle(37, 55, 6, '#fff')}${circle(63, 55, 6, '#fff')}${circle(37, 56, 3.4, '#2c1b14')}${circle(63, 56, 3.4, '#2c1b14')}
      ${path('M40 88h20l-4 10h-12z', '#F2C14E')}${star(50, 92, 4, '#D7263D')}`,
  },
  {
    id: 'lectora', name: 'Lectora Hojita', theme: 'En la biblioteca', fur: '#dcb074',
    bg: `${rect(0, 0, 120, 120, '#7B4B2A')}
      ${[32, 66, 100].map((y) => rect(0, y, 120, 4, '#55321B')).join('')}
      ${[[4, 10, 22, '#E4572E'], [15, 8, 18, '#4FB3D9'], [24, 10, 24, '#F2C14E'], [35, 7, 20, '#7DBB5C'], [78, 9, 24, '#F2577F'], [88, 8, 18, '#DCD2EE'], [97, 10, 22, '#4FB3D9'], [108, 8, 20, '#E4572E'],
        [4, 9, 56, '#7DBB5C'], [14, 8, 52, '#F2577F'], [100, 9, 56, '#F2C14E'], [110, 7, 50, '#4FB3D9'],
        [4, 8, 90, '#DCD2EE'], [13, 10, 88, '#E4572E'], [98, 10, 90, '#7DBB5C'], [109, 8, 86, '#F2C14E']].map(([x, w, top, c]) => rect(x, top, w, (top > 80 ? 100 : top > 40 ? 66 : 32) - top, c)).join('')}`,
    acc: `${glasses('#6B3E26', '#ffffff" fill-opacity=".22')}
      ${path('M18 94c10-7 23-7 32-2 9-5 22-5 32 2v12c-10-6-23-6-32-1-9-5-22-5-32 1z', '#FFF8EF')}${path('M49 92h2v13h-2z', '#C9A06F')}
      ${line('M25 95c6-2 13-2 19 0M56 95c6-2 13-2 19 0M25 100c6-2 13-2 19 0M56 100c6-2 13-2 19 0', '#C9A06F', 1.2)}`,
  },
  {
    id: 'jardinera', name: 'Jardinera Margarita', theme: 'En el jardín', fur: MUU_PINK, colors: MUU_COLORS,
    bg: `${rect(0, 0, 120, 120, '#CDEFFA')}${circle(100, 20, 10, '#FFE27A')}${path('M8 30c8-7 20-7 26 0zM58 18c7-5 16-5 22 0z', '#fff')}
      ${[4, 18, 32, 88, 102, 116].map((x) => path(`M${x - 4} 90V66l4-6 4 6v24z`, '#FFF8EF')).join('')}${rect(0, 72, 120, 4, '#FFF8EF')}
      ${path('M0 120V88c40-6 80-6 120 0v32z', '#8CC56B')}
      ${daisy(12, 104, 4)}${daisy(32, 112, 3, '#F6CAD2')}${daisy(94, 110, 4, '#DCD2EE')}${daisy(110, 100, 3)}`,
    acc: `${[[20, 26], [31, 18], [43, 14], [57, 14], [69, 18], [80, 26]].map(([x, y], i) => daisy(x, y, 4, i % 2 ? '#fff' : '#F6E3A5', i % 2 ? '#F6C445' : '#EFA8B7')).join('')}`,
  },
  {
    id: 'chapina', name: 'Muu Chapina', theme: 'En Antigua Guatemala', special: 'chapina', fur: '#b8703a',
    bg: `${rect(0, 0, 120, 120, '#AEE1F2')}
      ${path('M-14 86L26 14l40 72z', '#5E8468')}${path('M26 14l-10 18 6-3 4 4 4-4 6 3z', '#E9EFE6')}
      ${path('M64 120V52c0-6 4-10 10-10h4v-8h6v-6h12v6h6v8h4c6 0 10 4 10 10h4v68h-14V84c0-14-24-14-24 0v36z', '#F2C14E')}
      ${rect(74, 56, 34, 3, '#D9A520')}${circle(90, 36, 4.5, '#fff', 'stroke="#8A5A33" stroke-width="1"')}${line('M90 36v-3M90 36l2 1', '#3a2c27', 1)}
      ${rect(0, 110, 120, 10, '#A9A08C')}`,
    acc: `${[['#D7263D', 0], ['#2B59C3', 3], ['#F2C14E', 6], ['#3F9142', 9]].map(([c, i]) => line(`M20 ${28 - i}C32 ${17 - i} 68 ${17 - i} 80 ${28 - i}`, c, 3.2)).join('')}
      ${[0, 1, 2, 3, 4].map((i) => path(`M${30 + i * 8} 97l4-5 4 5-4 5z`, ['#F2C14E', '#2B59C3', '#3F9142', '#fff', '#F2C14E'][i])).join('')}
      ${line('M28 90c14 5 30 5 44 0', '#F2C14E', 1.6)}${circle(20, 62, 2.5, '#F2C14E')}${circle(80, 62, 2.5, '#F2C14E')}`,
  },
  {
    id: 'enamorada', name: 'Muu Enamorada', theme: 'En su aniversario', special: 'aniversario', fur: MUU_PINK, colors: MUU_COLORS,
    bg: `${rect(0, 0, 120, 120, '#FCE0E6')}
      ${heart(14, 18, 6, '#F2577F')}${heart(100, 14, 8, '#EFA8B7')}${heart(36, 8, 3.5, '#EFA8B7')}${heart(112, 50, 4, '#F2577F')}${heart(8, 58, 4, '#EFA8B7')}
      ${line('M14 26c2 18-4 30 0 48M100 24c-2 20 4 34 0 52', '#C98A9A', 1)}${rect(0, 104, 120, 16, '#F6CAD2')}${heart(20, 110, 3, '#fff')}${heart(100, 112, 3, '#fff')}`,
    acc: `${path('M34 28L50-8l16 36c-10 4-22 4-32 0z', '#F2577F')}${line('M42 12l14 4M38 21l22 5', '#FFF8EF', 2.5)}${circle(50, -9, 4, '#FFE27A')}
      ${heart(50, 96, 8, '#E63946')}${line('M34 88c6 3 10 5 14 7M66 88c-6 3-10 5-14 7', '#E63946', 2)}`,
  },
  {
    id: 'campeona', name: 'Muu Campeona', theme: 'Sus primeras 10 citas', special: 'meta', meta: 10, fur: '#dcb074',
    bg: `${rect(0, 0, 120, 120, '#DCD2EE')}
      ${[[10, 12, '#F2577F'], [28, 24, '#F2C14E'], [46, 8, '#4FB3D9'], [76, 14, '#7DBB5C'], [100, 8, '#F2577F'], [110, 30, '#F2C14E'], [8, 42, '#7DBB5C'], [106, 56, '#4FB3D9']].map(([x, y, c], i) => rect(x, y, 5, 3, c, `transform="rotate(${i * 37} ${x} ${y})"`)).join('')}
      ${rect(0, 100, 30, 20, '#BDAEDD')}${rect(90, 100, 30, 20, '#BDAEDD')}${rect(30, 92, 60, 28, '#A58FD0')}`,
    acc: `${path('M36 78l10 12h8l10-12-6-1-8 9-8-9z', '#2B59C3')}
      ${circle(50, 92, 11, '#F2C14E', 'stroke="#C9971F" stroke-width="2"')}<text x="50" y="96.500" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="11" fill="#7A5A10">10</text>`,
  },
  {
    id: 'estrella', name: 'Muu Estrella', theme: 'Sus primeras 25 citas', special: 'meta', meta: 25, fur: '#efe7da',
    bg: `${rect(0, 0, 120, 120, '#7E1F2E')}
      ${path('M0 0h30c-2 40-12 72-30 88zM120 0H90c2 40 12 72 30 88z', '#B32F44')}${line('M10 0c0 30-3 58-10 76M20 0c-1 30-7 56-16 76M110 0c0 30 3 58 10 76M100 0c1 30 7 56 16 76', '#8F2436', 1.5)}
      ${rect(0, 0, 120, 8, '#F2C14E')}${dots([[10, 4], [24, 4], [38, 4], [52, 4], [66, 4], [80, 4], [94, 4], [108, 4]], '#FFF5C2', 2)}
      ${path('M30 120l14-22h32l14 22z', '#D7263D')}${star(14, 104, 6, '#F2C14E')}${star(106, 104, 6, '#F2C14E')}`,
    acc: `${sunglasses('#2A2430')}${star(84, 26, 9, '#F2C14E')}
      ${path('M50 92l-16-8c-3 5-3 12 0 16zM50 92l16-8c3 5 3 12 0 16z', '#F2C14E')}${circle(50, 92, 4, '#C9971F')}`,
  },
  {
    id: 'reina', name: 'Reina Muu', theme: 'Sus primeras 50 citas', special: 'meta', meta: 50, fur: '#9a4f2c',
    bg: `${rect(0, 0, 120, 120, '#F6E3A5')}
      ${path('M0 120V62h8v-8h6v8h6v-8h6v8h6v-8h6v8h6V48h6v8h6v-8h6v8h6v-8h6v14h6v-8h6v8h6v-8h6v8h6v-8h6v8h8v58z', '#C9B7E8')}
      ${path('M104 46V28l12 6-12 6', '#D7263D')}${line('M104 54V26', '#7A5A10', 1.6)}
      ${star(14, 20, 4, '#fff')}${star(100, 14, 5, '#fff')}${star(110, 38, 3, '#fff')}
      ${rect(0, 104, 120, 16, '#8E6FC4')}`,
    under: path('M12 62C-4 92-2 124 4 136h92c6-12 8-44-8-74z', '#8A5BC4'),
    acc: `${path('M24 28L18 2l14 12L40-6l10 16L60-6l8 20L82 2l-6 26c-16-6-36-6-52 0z', '#F2C14E', 'stroke="#C9971F" stroke-width="1.5"')}
      ${circle(40, 16, 2.5, '#D7263D')}${circle(50, 18, 3, '#4FB3D9')}${circle(60, 16, 2.5, '#D7263D')}
      ${dots([[34, 92], [42, 95], [50, 96], [58, 95], [66, 92]], '#2A2430', 1.2)}`,
  },

  // Viajeras: una por país, de los más visitados y conocidos. `places` son palabras que la ganan si aparecen en el lugar de la cita.
  {
    id: 'francia', name: 'Muu Parisina', theme: 'París, Francia', fur: '#b8703a', places: ['francia', 'paris'],
    bg: `${rect(0, 0, 120, 120, '#CDE7F5')}${path('M10 26c7-6 17-6 24 0zM44 12c6-4 14-4 20 0z', '#fff')}
      ${path('M104 8l2 2 2 22 4 28 7 40h-9c-1-9-3-14-6-14s-5 5-6 14h-9l7-40 4-28 2-22z', '#6B5E57')}${rect(97, 44, 14, 3, '#4F443E')}${rect(94, 66, 20, 3, '#4F443E')}
      ${path('M0 120v-20c40-5 80-5 120 0v20z', '#8CC56B')}`,
    acc: `${path('M18 27C20 8 80 3 86 24 70 35 32 37 18 27z', '#2A2430')}${line('M54 8l1-6', '#2A2430', 3)}
      ${line('M84 102L96 70', '#D9A45B', 7)}${line('M86 94l5-2M89 86l5-2M92 78l4-2', '#A87432', 1.2)}`,
  },
  {
    id: 'espana', name: 'Muu Flamenca', theme: 'Barcelona, España', fur: '#4d3a33', places: ['espana', 'madrid', 'barcelona', 'sevilla'],
    bg: `${rect(0, 0, 120, 120, '#FFE3B3')}${circle(102, 22, 11, '#FFC233')}
      ${path('M2 100V40l4-24 4 24v14h4V30l4-22 4 22v70z', '#C9A06F')}${dots([[6, 44], [6, 54], [6, 64], [18, 36], [18, 48], [18, 60]], '#8A5A33', 1.4)}
      ${path('M96 100V66c0-10 18-10 18 0v34z', '#E8B87A')}${path('M100 100V74c0-6 10-6 10 0v26z', '#A87432')}
      ${rect(0, 100, 120, 20, '#D98E4A')}`,
    acc: `${[0, 1, 2, 3, 4].map((i) => { const a = (i * 2 * Math.PI) / 5; return circle((22 + Math.cos(a) * 6).toFixed(1), (28 + Math.sin(a) * 6).toFixed(1), 5, '#D7263D'); }).join('')}${circle(22, 28, 2.5, '#FFD23F')}
      ${path('M78 96L60 78c6-9 26-14 38-8z', '#D7263D')}${line('M78 96L66 80M78 96l-4-21M78 96l8-23M78 96l16-24', '#8F1426', 1)}`,
  },
  {
    id: 'usa', name: 'Muu Libertad', theme: 'Nueva York, Estados Unidos', fur: '#7CC7AF', places: ['estados unidos', 'usa', 'nueva york', 'new york', 'miami', 'california'],
    bg: `${rect(0, 0, 120, 120, '#BFE3F5')}${path('M90 74V42h8v-8h6v8h6v14h10v18zM0 74V54h10v-8h8v28z', '#7A8BA0')}
      ${dots([[93, 48], [93, 56], [93, 64], [106, 48], [106, 58], [4, 60], [12, 54], [12, 64]], '#FFE27A', 1)}
      ${rect(0, 74, 120, 46, '#3E8FB0')}${line('M0 86q10-5 20 0t20 0 20 0 20 0 20 0 20 0M0 104q10-5 20 0t20 0 20 0 20 0 20 0 20 0', '#8FCFE3', 2)}`,
    acc: `${[14, 30, 50, 70, 86].map((x, i) => path(`M${x - 5} 28L${x + (x - 50) * 0.16} ${i === 2 ? -12 : -4}L${x + 5} 28z`, '#5FAE96')).join('')}${path('M16 24c20-7 48-7 68 0v8c-20-6-48-6-68 0z', '#4E9A82')}
      ${rect(90, 54, 5, 34, '#4E9A82')}${path('M86 50h13l-3 6h-7z', '#4E9A82')}${path('M92 34c5 5 6 9 1 16-5-6-5-11-1-16z', '#FFC233')}`,
  },
  {
    id: 'italia', name: 'Muu Gondolera', theme: 'Roma y Venecia, Italia', fur: '#dcb074', places: ['italia', 'roma', 'venecia', 'florencia', 'milan'],
    bg: `${rect(0, 0, 120, 120, '#BFE6F2')}
      ${path('M0 86V36c10-8 22-10 30-10v60zM90 26c10 0 20 2 30 10v50z', '#D9B382')}
      ${[4, 14, 24, 94, 104, 114].flatMap((x) => [path(`M${x - 3} 52c0-6 6-6 6 0v8h-6z`, '#8A6A45'), path(`M${x - 3} 72c0-6 6-6 6 0v10h-6z`, '#8A6A45')]).join('')}
      ${rect(0, 86, 120, 34, '#3AA0A8')}${line('M0 100q10-5 20 0t20 0 20 0 20 0 20 0 20 0', '#A3E0E0', 2)}`,
    acc: `${path('M26 24c0-14 48-14 48 0z', '#F3D88C')}${rect(26, 19, 48, 6, '#D7263D')}${path('M8 26c18 7 66 7 84 0-6 9-22 12-42 12S14 35 8 26z', '#E9C970')}
      ${path('M78 90l18-6-6 22z', '#F2C14E')}${circle(86, 91, 2, '#D7263D')}${circle(90, 97, 1.8, '#D7263D')}${path('M77 89l20-7 1 3-20 7z', '#B8743A')}`,
  },
  {
    id: 'turquia', name: 'Muu Globera', theme: 'Capadocia, Turquía', fur: '#c78a52', places: ['turquia', 'estambul', 'capadocia'],
    bg: `${rect(0, 0, 120, 120, '#FAD4C0')}${rect(0, 0, 120, 30, '#F7B8A8')}
      ${circle(16, 24, 11, '#E4572E')}${path('M9 32l4 9h6l4-9z', '#E4572E')}${rect(13, 42, 6, 4, '#8A5A33')}
      ${circle(102, 18, 13, '#4FB3D9')}${path('M94 28l4 10h8l4-10z', '#4FB3D9')}${rect(98, 39, 8, 4, '#8A5A33')}
      ${circle(84, 46, 6, '#F2C14E')}${rect(82, 54, 4, 3, '#8A5A33')}
      ${path('M0 120V84c2-14 6-14 8-2 2-8 6-8 8 2l4 36zM96 120l4-40c2-12 6-12 8 0 2-8 6-8 8 0l4 40z', '#D9A577')}${rect(0, 104, 120, 16, '#C98A5A')}`,
    acc: `${path('M23 30C21 6 79 6 77 30z', '#7A4A2B')}${rect(21, 24, 58, 6, '#5C3620', 'rx="2"')}
      ${circle(38, 22, 7, '#BFEFFF', 'stroke="#3A2C27" stroke-width="2.500"')}${circle(62, 22, 7, '#BFEFFF', 'stroke="#3A2C27" stroke-width="2.500"')}
      ${circle(50, 96, 6, '#2B59C3')}${circle(50, 96, 4, '#fff')}${circle(50, 96, 2.5, '#6FD6FF')}${circle(50, 96, 1, '#1F1A1C')}`,
  },
  {
    id: 'mexico', name: 'Muu Mexicana', theme: 'Chichén Itzá, México', fur: '#9a4f2c', places: ['mexico', 'cancun', 'chichen', 'oaxaca'],
    bg: `${rect(0, 0, 120, 120, '#AEE5F2')}
      ${line('M0 8c30 6 90 6 120 0', '#8A5A33', 1)}${['#F2577F', '#FFD23F', '#3F9142', '#2B59C3', '#E4572E', '#8E5BC4', '#F2577F'].map((c, i) => rect(4 + i * 17, 9 + (i > 0 && i < 6 ? 2 : 0), 13, 13, c)).join('')}
      ${path('M0 94V76h6v-9h6v-9h6v-8h6v8h6v9h6v9h6v18z', '#B5AB94')}${rect(16, 52, 4, 42, '#8E856F')}
      ${path('M108 100V74c0-6 8-6 8 0v26zM102 88v-8c0-3 4-3 4 0v5h3v5h-5c-1 0-2-1-2-2z', '#4F8A4C')}
      ${rect(0, 94, 120, 26, '#D9B56E')}`,
    acc: `${path('M28 24C28 2 72 2 72 24z', '#D7263D')}${path('M27 20c15 4 31 4 46 0v5c-15 4-31 4-46 0z', '#F2C14E')}
      ${path('M-6 24c18 12 94 12 112 0-6 15-30 20-56 20S0 39-6 24z', '#E4572E')}${line('M4 32c26 8 66 8 92 0', '#FFD23F', 2)}
      ${[34, 42, 50, 58, 66].map((x, i) => daisy(x, i % 2 ? 95 : 92, 2.4, ['#F2577F', '#FFD23F', '#4FB3D9', '#FFD23F', '#F2577F'][i], '#fff')).join('')}`,
  },
  {
    id: 'reino-unido', name: 'Muu Londinense', theme: 'Londres, Reino Unido', fur: '#a7a09a', places: ['reino unido', 'londres', 'inglaterra', 'escocia'],
    bg: `${rect(0, 0, 120, 120, '#C9D6E2')}${path('M4 26c8-7 20-7 28 0zM50 16c8-6 18-6 26 0z', '#EEF2F5')}
      ${path('M98 100V34l6-18 6 18v66z', '#C9A06F')}${circle(104, 44, 6, '#FFF8EF', 'stroke="#6B4226" stroke-width="1.500"')}${line('M104 44v-4M104 44l3 1', '#2A2430', 1)}
      ${rect(4, 62, 20, 38, '#D7263D', 'rx="2"')}${rect(7, 67, 14, 14, '#BFE3F5')}${line('M14 67v14M7 74h14', '#D7263D', 1.5)}${rect(7, 84, 14, 12, '#A81D2F')}
      ${rect(0, 100, 120, 20, '#8E9AA6')}`,
    acc: `${path('M24 34C10 2 28-30 50-30s40 32 26 64c-16-5-36-5-52 0z', '#1F1A1C')}${line('M28 32C40 28 60 28 72 32', '#F2C14E', 2)}
      ${line('M22 40c10 40 46 40 56 0', '#F2C14E', 1.4)}
      ${dots([[50, 99], [50, 107], [50, 115]], '#F2C14E', 1.8)}`,
  },
  {
    id: 'alemania', name: 'Muu Bávara', theme: 'Baviera, Alemania', fur: '#b8703a', places: ['alemania', 'berlin', 'munich', 'baviera'],
    bg: `${rect(0, 0, 120, 120, '#D5EEF7')}
      ${path('M86 76V44l3-10 3 10v-8l4-14 4 14v10l3-10 3 10v30h6v10H84V76z', '#F4EFE6')}${path('M86 44l3-10 3 10zM92 36l4-14 4 14zM100 46l3-10 3 10z', '#4F6D9E')}${dots([[96, 48], [96, 58], [103, 54]], '#6B5E57', 1.5)}
      ${path('M60 90c16-22 44-24 60-12v14z', '#4F8A4C')}
      ${path('M2 88l9-26 9 26zM14 92l8-22 8 22z', '#2F6F4A')}
      ${path('M0 120V90c40-6 80-6 120 0v30z', '#6FA85A')}`,
    acc: `${path('M24 28C22 6 78 6 76 28z', '#3F6B4A')}${path('M12 27c18 7 58 7 76 0-5 8-20 11-38 11s-33-3-38-11z', '#2F5539')}${rect(24, 22, 52, 4, '#E8D9B8')}
      ${path('M76 18c2-12 10-18 16-20-2 9-6 16-12 22z', '#4FB3D9')}
      ${line('M86 80c-8-4-12 8-4 10 5 1 8-4 5-7M86 80c8-4 12 8 4 10-5 1-8-4-5-7', '#B8743A', 3.5)}
      ${line('M34 90L40 120M66 90l-6 30', '#3F6B4A', 4)}`,
  },
  {
    id: 'grecia', name: 'Muu Griega', theme: 'Santorini, Grecia', fur: '#efe7da', places: ['grecia', 'atenas', 'santorini'],
    bg: `${rect(0, 0, 120, 120, '#9ADCF5')}${rect(0, 60, 120, 60, '#2C8FC2')}${circle(100, 22, 9, '#FFE27A')}
      ${path('M0 120V64h16V52c0-10 16-10 16 0v30h-4v38z', '#FFFFFF')}${path('M16 52c0-10 16-10 16 0z', '#2B6FB3')}${rect(4, 74, 6, 9, '#2B6FB3', 'rx="3"')}
      ${path('M120 120V58h-12V50c0-8-14-8-14 0v22h-4v48z', '#FFFFFF')}${path('M94 50c0-8 14-8 14 0z', '#2B6FB3')}${rect(108, 72, 6, 9, '#2B6FB3', 'rx="3"')}`,
    acc: `${[18, 28, 38, 62, 72, 82].map((x, i) => path(`M${x} ${i < 3 ? 28 - i * 4 : 20 + (i - 3) * 4}c3-6 8-6 10-2-3 5-7 6-10 2z`, '#6FA85A')).join('')}${line('M18 30C30 16 70 16 82 30', '#C9971F', 2)}
      ${line('M34 90L66 120', '#2B6FB3', 4)}`,
  },
  {
    id: 'austria', name: 'Muu Vienesa', theme: 'Viena, Austria', fur: '#4d3a33', places: ['austria', 'viena', 'salzburgo'],
    bg: `${rect(0, 0, 120, 120, '#F7E6B8')}
      ${rect(0, 40, 120, 60, '#F2C14E')}${path('M0 40l30-14h60l30 14z', '#5FA8A0')}
      ${[6, 26, 86, 106].map((x) => path(`M${x} 88V60c0-8 8-8 8 0v28z`, '#FFF8EF')).join('')}
      ${rect(0, 100, 120, 20, '#8CC56B')}
      ${line('M20 16v9M20 16l5-2', '#3A2C27', 1.6)}${circle(18, 25, 2.2, '#3A2C27')}${line('M100 10v9M100 10l5 2v9', '#3A2C27', 1.6)}${circle(98, 19, 2.2, '#3A2C27')}${circle(103, 21, 2.2, '#3A2C27')}`,
    acc: `${path('M41 88l9 8 9-8-4-3-5 3-5-3z', '#FFFFFF')}${path('M44 90l6 3 6-3-2 5-4-1-4 1z', '#D7263D')}
      ${path('M72 74c8-5 14-2 15 4s-3 9-3 12 5 5 3 11-11 8-17 2-4-13-1-15 3-4 3-14z', '#A85C2A')}${line('M76 72L92 44', '#3A2C27', 2.5)}${line('M92 56L64 110', '#E9C970', 1.3)}`,
  },
  {
    id: 'japon', name: 'Muu Japonesa', theme: 'Monte Fuji, Japón', fur: '#efe7da', places: ['japon', 'tokio', 'kioto', 'osaka'],
    bg: `${rect(0, 0, 120, 120, '#FDE8EE')}
      ${path('M60 92l44-58c4-5 8-5 12 0l24 58z', '#7E9CC4')}${path('M100 40c4-6 12-6 16 0l6 8-6-2-5 4-5-4-6 3z', '#fff')}
      ${path('M4 96V48M30 96V48', '#D7263D', 'stroke="#D7263D" stroke-width="5"')}${path('M-2 42c10 3 28 3 38 0v6H-2z', '#D7263D')}${rect(0, 54, 34, 4, '#D7263D')}
      ${[[50, 12], [62, 8], [74, 14], [40, 8], [88, 8]].map(([x, y]) => daisy(x, y, 3, '#F9B7CB', '#fff')).join('')}${line('M30 4C50 14 76 16 96 2', '#7A4A2B', 2)}
      ${rect(0, 96, 120, 24, '#A6C98A')}`,
    acc: `${daisy(22, 24, 4, '#F2577F', '#FFE27A')}${line('M26 28l10 8', '#C9971F', 2)}${circle(37, 37, 1.8, '#C9971F')}
      ${path('M38 86l12 14 12-14 4 3-16 17-16-17z', '#FFF8EF')}
      ${rect(26, 106, 48, 10, '#F2C14E')}
      ${path('M80 100L66 84c5-6 19-9 27-5z', '#2B59C3')}${line('M80 100L72 82M80 100l1-21M80 100l9-20', '#FFF8EF', 1)}`,
  },
  {
    id: 'tailandia', name: 'Muu Tailandesa', theme: 'Bangkok, Tailandia', fur: '#c78a52', places: ['tailandia', 'bangkok', 'phuket'],
    bg: `${rect(0, 0, 120, 120, '#FFD8A8')}${circle(60, 18, 13, '#FFB347')}
      ${[[12, 90, 14], [100, 90, 16]].map(([x, base, w]) => `${path(`M${x - w} ${base}c8-6 8-16 ${w - 3}-40l3-22 3 22c${w - 8} 24 ${w - 8} 34 ${w - 3} 40z`, '#F2C14E')}${rect(x - w, base - 6, w * 2, 3, '#D7263D')}${rect(x - w + 4, base - 16, w * 2 - 8, 3, '#D7263D')}`).join('')}
      ${rect(0, 90, 120, 30, '#3AA0A8')}${line('M0 102q10-4 20 0t20 0 20 0 20 0 20 0 20 0', '#A3E0E0', 2)}`,
    acc: `${[0, 1, 2, 3, 4].map((i) => { const a = (i * 2 * Math.PI) / 5; return circle((78 + Math.cos(a) * 6).toFixed(1), (28 + Math.sin(a) * 6).toFixed(1), 4.5, '#B86FD6'); }).join('')}${circle(78, 28, 2.4, '#FFE27A')}
      ${[32, 40, 50, 60, 68].map((x, i) => circle(x, i === 2 ? 98 : i % 4 ? 96 : 92, 3.2, '#FFF8EF')).join('')}${path('M47 100h6l2 12-5-3-5 3z', '#E4572E')}`,
  },
  {
    id: 'china', name: 'Muu China', theme: 'Gran Muralla, China', fur: '#a7a09a', places: ['china', 'pekin', 'beijing', 'shanghai'],
    bg: `${rect(0, 0, 120, 120, '#DDEFF0')}
      ${path('M0 86c14-30 28-40 42-30 12 8 30 2 44-14 10-10 24-12 34-8v86H0z', '#7FA67A')}
      ${line('M0 94c14-28 28-36 42-28 14 8 32 2 46-14 8-9 22-11 32-7', '#B5AB94', 7)}${path('M88 54V38h14v16z', '#9A917C')}${path('M86 38l3-5h12l3 5z', '#7A725F')}
      ${line('M30 0v14M90 0v8', '#8A5A33', 1)}${path('M22 18c0-6 16-6 16 0v8c0 5-16 5-16 0z', '#D7263D')}${rect(26, 14, 8, 2, '#F2C14E')}${rect(26, 28, 8, 2, '#F2C14E')}
      ${rect(0, 104, 120, 16, '#6B8F5F')}`,
    acc: `${circle(26, 14, 8, '#6E665F')}${circle(74, 14, 8, '#6E665F')}${line('M20 10l-3-3M80 10l3-3', '#D7263D', 2)}
      ${line('M50 92v26', '#F2C14E', 2)}${dots([[50, 98], [50, 106], [50, 114]], '#F2C14E', 1.8)}
      ${line('M92 66v10', '#8A5A33', 1.5)}${path('M84 82c0-6 16-6 16 0v8c0 5-16 5-16 0z', '#D7263D')}${rect(88, 78, 8, 2, '#F2C14E')}${rect(88, 92, 8, 2, '#F2C14E')}${line('M92 94v8', '#F2C14E', 1.5)}`,
  },
  {
    id: 'egipto', name: 'Muu Faraona', theme: 'Giza, Egipto', fur: '#dcb074', places: ['egipto', 'cairo', 'giza'],
    bg: `${rect(0, 0, 120, 120, '#FCE2A8')}${circle(100, 20, 12, '#FF9F43')}
      ${path('M-14 90L14 42l28 48z', '#D9A45B')}${path('M14 42l28 48H14z', '#BC8740')}
      ${path('M84 90l20-34 22 34z', '#D9A45B')}${path('M104 56l22 34h-22z', '#BC8740')}
      ${rect(0, 90, 120, 30, '#EBC87D')}${line('M4 104q10-4 20 0M90 108q10-4 20 0', '#D9A45B', 2)}`,
    acc: `${path('M14 38C12 2 88 2 86 38l6 44c-8 2-12-2-14-8V40C70 30 30 30 22 40v34c-2 6-6 10-14 8z', '#F2C14E')}
      ${line('M17 28C28 10 72 10 83 28M14 42l-3 28M86 42l3 28', '#2B59C3', 3)}${line('M19 48l-2 24M81 48l2 24', '#2B59C3', 3)}
      ${path('M30 88c12 7 28 7 40 0l5 12c-14 8-36 8-50 0z', '#2B59C3')}${line('M28 92c14 7 30 7 44 0', '#F2C14E', 2.5)}${line('M27 98c14 7 32 7 46 0', '#F2C14E', 2.5)}`,
  },
  {
    id: 'brasil', name: 'Muu Carioca', theme: 'Río de Janeiro, Brasil', fur: '#9a4f2c', places: ['brasil', 'rio de janeiro', 'sao paulo'],
    bg: `${rect(0, 0, 120, 120, '#9CE1F5')}${circle(20, 18, 9, '#FFD23F')}
      ${path('M72 82c6-30 14-46 24-40 8 5 12 18 14 26l10 14z', '#4F8A6A')}${path('M0 82c4-14 12-20 22-10l8 10z', '#5E9A76')}
      ${rect(100, 28, 2.500, 14, '#EEE')}${rect(95, 31, 12, 2, '#EEE')}
      ${rect(0, 82, 120, 12, '#2AA9C4')}${path('M0 120V92c40-5 80-5 120 0v28z', '#F6DFA3')}`,
    acc: `${[['#E4572E', 18, 6], ['#FFD23F', 28, -4], ['#3F9142', 40, -12], ['#F2577F', 50, -15], ['#3F9142', 60, -12], ['#FFD23F', 72, -4], ['#E4572E', 82, 6]].map(([c, x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5.500" ry="14" fill="${c}" transform="rotate(${(x - 50) * 1.2} ${x} ${y})"/>`).join('')}
      ${path('M18 24c18-8 46-8 64 0v7c-18-6-46-6-64 0z', '#F2C14E')}${circle(50, 22, 3.5, '#D7263D')}
      ${[34, 42, 50, 58, 66].map((x, i) => circle(x, i % 2 ? 96 : 93, 2.6, i % 2 ? '#FFD23F' : '#3F9142')).join('')}`,
  },
  {
    id: 'peru', name: 'Muu Peruana', theme: 'Machu Picchu, Perú', fur: '#f5efe4', places: ['peru', 'machu picchu', 'cusco', 'cuzco', 'lima'],
    bg: `${rect(0, 0, 120, 120, '#CFEAF5')}${path('M6 24c8-6 18-6 24 0zM78 14c7-5 16-5 22 0z', '#fff')}
      ${path('M72 88c6-30 14-54 26-58 10-2 18 20 22 38v20z', '#4F7F5F')}${path('M0 88c6-14 16-24 26-22 8 2 14 10 20 22z', '#6B9A70')}
      ${[[2, 78], [12, 84], [92, 80], [102, 74], [110, 84]].map(([x, y]) => rect(x, y, 8, 6, '#B5AB94')).join('')}
      ${line('M0 94h120M0 102h120M0 110h120', '#6FA85A', 3)}${rect(0, 88, 120, 3, '#8CC56B')}`,
    acc: `${path('M23 30C21 4 79 4 77 30l3 22c-5 2-9-1-10-6l-1-14C60 26 40 26 31 32l-1 14c-1 5-5 8-10 6z', '#D7263D')}
      ${[['#FFD23F', 20], ['#2B59C3', 14], ['#3F9142', 8]].map(([c, y]) => line(`M26 ${y + 4}C36 ${y - 4} 64 ${y - 4} 74 ${y + 4}`, c, 3)).join('')}${circle(50, 1, 4.5, '#FFD23F')}
      ${line('M21 52v7M79 52v7', '#FFD23F', 2)}
      ${line('M34 106l32 0M28 114h44', '#FFD23F', 2.5)}${[36, 44, 52, 60].map((x) => path(`M${x} 100l3-3 3 3-3 3z`, '#3F9142')).join('')}`,
  },
  {
    id: 'india', name: 'Muu India', theme: 'Taj Mahal, India', fur: '#efe7da', places: ['india', 'delhi', 'agra', 'taj mahal'],
    bg: `${rect(0, 0, 120, 120, '#FBD3D0')}${rect(0, 0, 120, 26, '#F7B4BE')}
      ${path('M0 88V58c0-20 8-26 16-34 6 8 16 14 16 34v30z', '#FFFDF8')}${path('M12 30l4-16 4 16z', '#E5DCCB')}${path('M6 88V68c0-6 18-6 18 0v20z', '#C9B8A0')}
      ${path('M102 88V40l3-14 3 14v48zM112 88V50l2-10 2 10v38z', '#FFFDF8')}
      ${rect(0, 88, 120, 32, '#6FB4C9')}${line('M0 100q10-4 20 0t20 0 20 0 20 0 20 0 20 0', '#BDE5EE', 2)}`,
    acc: `${line('M50 16v16', '#F2C14E', 1.8)}${circle(50, 34, 2.8, '#D7263D')}${line('M32 12c6 3 12 4 18 4s12-1 18-4', '#F2C14E', 1.8)}
      ${[30, 36, 43, 50, 57, 64, 70].map((x, i) => circle(x, [90, 95, 99, 101, 99, 95, 90][i], 3.6, i % 2 ? '#FFB347' : '#FF8C2B')).join('')}
      ${line('M30 92c6 22 36 22 44 28', '#F2C14E', 3)}`,
  },
  {
    id: 'marruecos', name: 'Muu Marroquí', theme: 'Marrakech, Marruecos', fur: '#b8703a', places: ['marruecos', 'marrakech', 'fez'],
    bg: `${rect(0, 0, 120, 120, '#FBCB95')}${circle(20, 20, 10, '#FFE27A')}
      ${path('M86 100V52c0-16 34-16 34 0v48z', '#2B6FB3')}${path('M92 100V58c0-10 22-10 22 0v42z', '#C9E4F5')}${[[90, 50], [116, 50], [103, 40]].map(([x, y]) => circle(x, y, 2, '#F2C14E')).join('')}
      ${path('M0 100c8-14 18-20 30-14 8 4 14 8 22 14z', '#E5A15C')}
      ${path('M6 86c-1-5 3-6 5-4l4-2c3-3 6 0 8 2 4-2 7 1 7 4v6h-2v-4h-2v4h-2v-4h-6v4h-2v-4h-2v4H8z', '#8A5A33')}
      ${rect(0, 100, 120, 20, '#E8B87A')}`,
    acc: `${path('M34 26l3-20c8-3 18-3 26 0l3 20c-10 3-22 3-32 0z', '#C1121F')}${line('M50 4c8 0 14 6 14 16', '#1F1A1C', 1.6)}${circle(64, 22, 2, '#1F1A1C')}
      ${path('M42 92h16l-3 26h-10z', '#F2C14E', 'opacity=".5"')}${line('M90 68v8', '#8A5A33', 1.5)}${path('M84 76h12l3 12c1 8-3 11-9 11s-10-3-9-11z', '#D9A45B')}${dots([[88, 85], [93, 85], [90, 91]], '#7A4A2B', 1.2)}`,
  },
  {
    id: 'australia', name: 'Muu Australiana', theme: 'Sídney, Australia', fur: '#dcb074', places: ['australia', 'sidney', 'sydney', 'melbourne'],
    bg: `${rect(0, 0, 120, 120, '#A8E0F5')}${circle(104, 18, 9, '#FFD23F')}
      ${path('M0 88c2-18 8-30 18-36-2 12 0 26 6 36zM14 88c2-14 8-24 18-28-2 10 0 20 4 28zM30 88c2-10 6-16 14-18-2 6-1 12 2 18z', '#FFFDF8')}${line('M18 52c-2 12 0 26 6 36M32 60c-2 10 0 20 4 28', '#D9D2C2', 1)}
      ${line('M78 88c8-26 34-26 42 0', '#6B7A88', 3)}${line('M84 76v12M94 66v22M106 66v22M116 76v12', '#6B7A88', 1.5)}
      ${rect(0, 88, 120, 32, '#2C8FC2')}${line('M0 102q10-4 20 0t20 0 20 0 20 0 20 0 20 0', '#8FCFE3', 2)}`,
    acc: `${path('M24 28C22 6 78 6 76 28z', '#B58A55')}${rect(23, 22, 54, 5, '#6B4226')}${path('M6 26c16 9 72 9 88 0 4 7-14 14-44 14S2 33 6 26z', '#A67C4A')}
      ${circle(40, 98, 4.5, '#8E93A0')}${circle(60, 98, 4.5, '#8E93A0')}${circle(50, 104, 9.500, '#A5A9B4')}${circle(47, 103, 1.2, '#1F1A1C')}${circle(53, 103, 1.2, '#1F1A1C')}${rect(48.500, 104, 3, 4, '#3A3236', 'rx="1.500"')}`,
  },
];

VAQUITAS.push(...MORE_VAQUITAS);
export const SERIES = [
  ['aventuras', 'Aventuras'], ['viajeras', 'Viajeras'], ['oficios', 'Oficios'], ['fiestas', 'Fiestas'], ['comida', 'Comida'], ['fantasia', 'Fantasía'], ['final', 'Premio final'],
];
export const seriesOf = (v) => v.series ?? (v.places || v.id === 'chapina' ? 'viajeras' : 'aventuras');
export const TOTAL_VAQUITAS = VAQUITAS.length;
const byId = (id) => VAQUITAS.find((v) => v.id === id);
export const vaquitaById = byId;

// La ropa de cada una: cuerpo, patas, calzado y pecho. Lo que no se indica sale de su pelaje.
const denim = { body: '#4F7CAC', limb: '#3F6690' };
const OUTFITS = {
  astronauta: { body: '#F3F5FA', limb: '#DDE2EE', chest: '#F3F5FA', hoof: '#6F7590', sole: '#B4B9CF' },
  vaquera: { ...denim, hoof: '#6B4226', sole: '#A06A3C' },
  capitana: { body: '#F3F5FA', limb: '#2A2430', hoof: '#1F1A1C', sole: '#5A5060' },
  chef: { body: '#FFFFFF', limb: '#EDE6D9', chest: '#FFFFFF', hoof: '#3A3236', sole: '#6E6468' },
  barista: { body: '#4C3323', limb: '#3E2A1D', chest: '#F3E6D2' },
  maga: { body: '#2A1C52', limb: '#3B2A6B', chest: '#3B2A6B', hoof: '#F2C14E', sole: '#FBE7A6' },
  rockera: { body: '#1F1A1C', limb: '#2F2830', hoof: '#F2577F', sole: '#FFFFFF' },
  buzo: { body: '#2B59C3', limb: '#1F45A0', chest: '#2B59C3', hoof: '#FFC233', sole: '#FFE27A' },
  artista: { body: '#F3E6D2', limb: '#E4D2B4', chest: '#F3E6D2' },
  exploradora: { body: '#C9AE76', limb: '#A98E57', chest: '#D9C08C', hoof: '#6B4226', sole: '#A06A3C' },
  esquiadora: { body: '#E63946', limb: '#B8202E', chest: '#E63946', hoof: '#2A2430', sole: '#6E6468' },
  super: { body: '#2B59C3', limb: '#1F45A0', chest: '#2B59C3', hoof: '#D7263D', sole: '#F2577F', tail: '#3a2c27' },
  lectora: { body: '#7DBB5C', limb: '#5F9A45' },
  jardinera: { body: '#8FB8DE', limb: '#6F9AC4', chest: '#F6CAD2', hoof: '#79645D', sole: '#C4AFA6' },
  chapina: { body: '#D7263D', limb: '#2B59C3', chest: '#D7263D' },
  enamorada: { limb: '#E58FA2', chest: '#F6CAD2', hoof: '#79645D', sole: '#C4AFA6' },
  estrella: { body: '#F2C14E', limb: '#D9A520', chest: '#F2C14E', hoof: '#D7263D', sole: '#F2577F' },
  reina: { body: '#6A3FA0', limb: '#55308A', chest: '#FFF8EF', hoof: '#F2C14E', sole: '#FBE7A6' },
  francia: { body: '#FFFFFF', limb: '#2A2430', chest: '#FFFFFF', hoof: '#1F1A1C', sole: '#5A5060' },
  espana: { body: '#D7263D', limb: '#A81D2F', chest: '#D7263D', hoof: '#1F1A1C', sole: '#5A5060' },
  usa: { body: '#7CC7AF', limb: '#5FAE96', chest: '#9AD8C4', hoof: '#4E9A82', sole: '#A9E0CE' },
  italia: { body: '#FFFFFF', limb: '#2A2430', chest: '#FFFFFF', hoof: '#1F1A1C', sole: '#5A5060' },
  turquia: { body: '#A5763F', limb: '#7A4A2B', chest: '#F3E6D2', hoof: '#3E2A1D', sole: '#7A5A40' },
  mexico: { body: '#FFFFFF', limb: '#EDE6D9', chest: '#FFFFFF' },
  'reino-unido': { body: '#D7263D', limb: '#1F1A1C', chest: '#D7263D', hoof: '#1F1A1C', sole: '#5A5060' },
  alemania: { body: '#FFFFFF', limb: '#7A4A2B', chest: '#FFFFFF', hoof: '#3E2A1D', sole: '#7A5A40' },
  grecia: { body: '#FFFFFF', limb: '#EDE6D9', chest: '#FFFFFF', hoof: '#C9971F', sole: '#F2D98A' },
  austria: { body: '#1F1A1C', limb: '#2F2830', chest: '#1F1A1C', hoof: '#1F1A1C', sole: '#5A5060' },
  japon: { body: '#F2577F', limb: '#D93F68', chest: '#F2577F', hoof: '#FFF8EF', sole: '#E8DCCB' },
  tailandia: { body: '#1E9C96', limb: '#178079', chest: '#1E9C96', hoof: '#C9971F', sole: '#F2D98A' },
  china: { body: '#D7263D', limb: '#A81D2F', chest: '#D7263D', hoof: '#1F1A1C', sole: '#5A5060' },
  egipto: { body: '#FFFFFF', limb: '#EDE6D9', chest: '#F2C14E', hoof: '#C9971F', sole: '#F2D98A' },
  brasil: { body: '#3F9142', limb: '#2F7033', hoof: '#F2C14E', sole: '#FBE7A6' },
  peru: { body: '#D7263D', limb: '#2A2430', chest: '#D7263D', hoof: '#1F1A1C', sole: '#5A5060' },
  india: { body: '#C2185B', limb: '#9A1148', chest: '#C2185B', hoof: '#C9971F', sole: '#F2D98A' },
  marruecos: { body: '#2B6FB3', limb: '#205A94', chest: '#2B6FB3', hoof: '#F2C14E', sole: '#FBE7A6' },
  australia: { body: '#C9AE76', limb: '#A98E57', chest: '#D9C08C', hoof: '#6B4226', sole: '#A06A3C' },
};
// Detalles de la ropa sobre el cuerpo, en coordenadas de la cara.
const CLOTHES = {
  astronauta: `${rect(42, 96, 16, 10, '#8E93B0', 'rx="2"')}${circle(46, 101, 1.8, '#E4572E')}${circle(52, 101, 1.8, '#6FD6FF')}`,
  capitana: line('M26 106h12M62 106h12M23 114h15M62 114h15', '#2B59C3', 3),
  chef: dots([[50, 104], [50, 112]], '#D7263D', 1.8),
  playera: [34, 42, 50, 58, 66].map((x, i) => daisy(x, i % 2 ? 94 : 91, 2.6, i % 2 ? '#FFD23F' : '#F2577F', '#fff')).join(''),
  maga: `${star(28, 112, 3, '#F2C14E')}${star(72, 110, 3, '#F2C14E')}`,
  rockera: star(50, 96, 6, '#FFE27A'),
  artista: dots([[30, 108, 2.5], [38, 114, 1.8], [68, 108, 2.2], [74, 114, 2.6]], '#F2577F') + dots([[66, 114, 1.8]], '#4FB3D9'),
  lectora: line('M27 106h10M63 106h10', '#5F9A45', 3),
  jardinera: `${rect(36, 90, 28, 14, '#8FB8DE', 'rx="3"')}${daisy(50, 97, 3)}`,
  esquiadora: line('M50 100v18', '#B8202E', 2),
  super: path('M40 96h20l-4 10h-12z', '#F2C14E') + star(50, 100, 3.5, '#D7263D'),
  estrella: star(50, 104, 4, '#fff'),
  francia: line('M28 104h10M62 104h10M26 112h12M62 112h12', '#2B59C3', 2.5),
  espana: dots([[28, 104], [34, 112], [66, 104], [72, 112]], '#fff', 2),
  italia: line('M28 104h10M62 104h10M26 112h12M62 112h12', '#D7263D', 2.5),
  'reino-unido': line('M26 106h12M62 106h12', '#F2C14E', 2),
  usa: line('M26 106h10M64 106h10', '#5FAE96', 2),
};

// La vaquita completa, sin su escena. Coordenadas de Muu sentada.
export const VAQ_VIEWBOX = '0 -32 120 172';
const figure = (v) => {
  const head = fluffyHead(v.fur, { colors: v.colors ?? {}, spots: v.spots ?? '' });
  const under = v.under ? `<g transform="translate(10 0)">${v.under}</g>` : '';
  return under + sittingFigure({ fur: v.fur, ...(v.outfit ?? OUTFITS[v.id]) }, head, v.acc + (CLOTHES[v.id] ?? ''));
};
export const vaquitaCow = (id) => figure(byId(id));

// Muu en su color, con el traje de una vaquita ganada. Si el traje no cambia el cuerpo, conserva el suyo.
export function muuFigure(breed, costumeId) {
  const v = costumeId ? byId(costumeId) : null;
  if (!v) return muuSittingInner(breed);
  const outfit = v.outfit ?? OUTFITS[v.id] ?? {};
  const body = { ...muuBodyColors(breed) };
  const colors = outfit.body ? { ...body, ...outfit, spots: '', tail: body.tail } : body;
  const under = v.under ? `<g transform="translate(10 0)">${v.under}</g>` : '';
  return under + sittingFigure(colors, muuBreedHead(breed), v.acc + (CLOTHES[v.id] ?? ''));
}
export const COSTUME_VIEWBOX = VAQ_VIEWBOX;

// La tarjeta completa con su fondo. `locked` muestra solo una silueta misteriosa.
export function vaquitaCard(id, { locked = false, className = 'vaq-card' } = {}) {
  const v = byId(id);
  const cow = `<g transform="translate(20 26) scale(.68)">${figure(v)}</g>`;
  if (locked) return `<svg class="${className} is-locked" viewBox="0 0 120 120" aria-hidden="true"><g class="vaq-shadow">${cow}</g></svg>`;
  return `<svg class="${className}" viewBox="0 0 120 120" role="img" aria-label="${v.name}"><g>${v.bg}</g>${cow}</svg>`;
}

// ---------- Cuál vaquita gana una cita ----------
const sameDay = (iso, sinceIso) => iso?.slice(5) === sinceIso?.slice(5) && iso?.slice(0, 4) > sinceIso?.slice(0, 4);
const regulars = VAQUITAS.filter((v) => !v.special);
const plain = (text) => (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const wordIn = (text, word) => new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(text);
const SERIES_WORDS = {
  fiestas: ['navidad', 'cumpleanos', 'cumple', 'boda', 'halloween', 'ano nuevo', 'graduacion', 'feria', 'carnaval', 'fiesta', 'pascua', 'cine', 'pelicula'],
  comida: ['cena', 'comida', 'almuerzo', 'desayuno', 'restaurante', 'pizza', 'sushi', 'taco', 'tacos', 'helado', 'postre', 'hamburguesa', 'ramen', 'chocolate', 'picnic', 'cocinar'],
  fantasia: ['teatro', 'juego', 'juegos', 'videojuegos', 'disfraces', 'museo'],
  oficios: ['clase', 'taller', 'trabajo', 'voluntariado', 'curso'],
};

// `taken` son los ids ya ganados; `total` es cuántas citas habrá contando esta.
// Primero las metas, luego las ocasiones especiales y por último la siguiente en orden.
export function nextVaquita({ taken = [], total = 1, date, title, place, ideaSrc, togetherSince } = {}) {
  const free = (id) => !taken.includes(id);
  const meta = VAQUITAS.find((v) => v.meta && v.meta <= total && free(v.id));
  if (meta) return meta.id;
  if (free('enamorada') && sameDay(date, togetherSince)) return 'enamorada';
  const where = plain(place);
  const traveler = VAQUITAS.find((v) => free(v.id) && v.places?.some((p) => wordIn(where, p)));
  if (traveler) return traveler.id;
  if (free('chapina') && (ideaSrc === 'guatemala' || (place ?? '').trim())) return 'chapina';
  // Según de qué trató la cita, sale una de la serie que le queda mejor.
  const about = plain(`${title ?? ''} ${place ?? ''}`);
  const named = regulars.find((v) => v.series && free(v.id) && wordIn(about, v.id));
  if (named) return named.id;
  const series = Object.keys(SERIES_WORDS).find((s) => SERIES_WORDS[s].some((w) => wordIn(about, w)));
  const themed = series && regulars.find((v) => v.series === series && free(v.id));
  if (themed) return themed.id;
  const next = regulars.find((v) => free(v.id));
  if (next) return next.id;
  // Ya no quedan por citas: salen las de ocasión especial que falten y, al final, Muu Dorada.
  const leftover = VAQUITAS.find((v) => v.special && !v.meta && v.id !== 'dorada' && free(v.id));
  if (leftover) return leftover.id;
  return VAQUITAS.every((v) => v.meta || v.id === 'dorada' || !free(v.id)) && free('dorada') ? 'dorada' : null;
}
