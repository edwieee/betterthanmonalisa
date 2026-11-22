# Better Than Mona Lisa

An independent digital museum of 42 public-domain paintings. Giovanni Paolo Panini’s *Interior of Saint Peter’s, Rome* opens the exhibition. From there, visitors can explore a curved gallery, follow one of eight thematic collections, or open a painting directly in its own viewing room.

## Run locally

Use Node.js 22.12 or later and npm. From the repository root, run:

```sh
npm ci
npm run dev
```

Open [the local museum](http://localhost:3000). Artwork, metadata, and fonts ship with the application. Local development requires no API keys or environment variables.

## Explore the museum

| Action | Control |
| --- | --- |
| Change the entrance painting | Use the two arrows beside the entrance plate number. Select the artwork title to see its record. |
| Explore in three dimensions | Drag horizontally around the wall and vertically between its three rows. Scroll to travel around the exhibition. |
| Inspect a painting | Hover to bring a panel forward and reveal its title and artist. Select the panel or its caption to enter the viewing room. |
| Navigate by keyboard | Tab to the gallery, use the left and right arrow keys to browse, and press Enter to open a painting. The gallery also has labeled previous and next buttons. |
| Explore on a phone | Swipe horizontally or use the arrow buttons. Tap the painting or its caption for details. |
| Leave the gallery | Choose **Continue to collections**. Wheel input also returns to page scrolling at the ends of the wall. |
| Look closer | Select **Fullscreen** in a viewing room. Use **Close** or Escape to leave the enlarged view. |
| Follow a collection | Open a room in the collection directory. Previous and next painting links follow that collection’s sequence. |
| Visit the source | **View original artwork** opens the individual National Gallery of Art record in a new tab. |

Small screens, reduced-motion preferences, and unavailable WebGL renderers use a single-painting presentation with the same collection and details.

## Implementation

Next.js App Router and TypeScript provide stable, pre-rendered routes for every painting and collection. Tailwind CSS and component styles handle the layout. Cormorant Garamond and DM Sans are served locally through Fontsource.

The exhibition uses Three.js, a perspective camera, curved subdivided planes, and raycasting. Panel dimensions follow the aspect ratio of each reproduction. Frame-time-based damping controls the camera, drag release, pointer response, and hover emphasis. The renderer loads near the exhibition, pauses when the wall leaves the viewport, and releases its resources on unmount. GSAP and ScrollTrigger coordinate the entrance artwork and text during scrolling.

| Location | Contents |
| --- | --- |
| `app/` | Homepage, collection routes, painting routes, and layout |
| `components/` | Entrance, editorial sections, gallery controls, and viewing room |
| `lib/gallery-scene.ts` | WebGL geometry, pointer picking, camera, and renderer lifecycle |
| `lib/museum.ts` | Collection definitions and artwork lookup |
| `data/paintings.json` | Museum metadata, local dimensions, source records, and editorial notes |
| `public/art/` | Full viewing images and smaller WebP gallery textures |

## Artwork and credits

The selection uses National Gallery of Art open data and images marked open access. Records were joined by the museum’s object ID with primary images in its published image catalog. Each entry retains the museum’s artist attribution, displayed date, medium, accession number, credit line, collection URL, and IIIF image-service URL. The small textures and larger viewing images are independent derivatives of the same source. [National Gallery of Art open data](https://github.com/NationalGalleryOfArt/opendata) · [Opening painting and image rights](https://www.nga.gov/artworks/50884-interior-saint-peters-rome)

Collection themes and curator’s notes are editorial selections made for this exhibition. The architectural entrance takes its visual direction from the supplied Aeterna reference. The museum’s spatial wall was written for this project, informed by Phantom Studios’ account of their work on gallery distortion, ambient cursor movement, and drag inertia. [Phantom Studios’ technical article](https://tympanus.net/codrops/2025/06/30/invisible-forces-the-making-of-phantom-lands-interactive-grid-and-3d-face-particle-system/)

## Check and deploy

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

To deploy on Vercel, import this repository, select the **Next.js** preset, use the repository root, and keep the default build and output settings. The production branch is `main`. The application serves its collection directly from the build and public assets.
