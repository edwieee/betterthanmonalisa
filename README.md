# Better Than Mona Lisa

An independent digital museum of 42 public-domain paintings. Giovanni Paolo Panini’s *Interior of Saint Peter’s, Rome* opens the exhibition. From there, visitors can explore the full-screen gallery at `/gallery`, follow one of eight thematic collections, or open a painting directly in its own viewing room.

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
| Enter the gallery | Choose **Enter the gallery** on the entrance wall or **Gallery** in the navigation. |
| Explore the wall | Drag or scroll in either direction. The grid repeats as you travel. Hover to highlight a painting and click to enter its viewing room. |
| Navigate by keyboard | Tab to the grid, use the arrow keys to centre a painting, and press Enter to open it. |
| Explore on a phone | Swipe across the grid and tap a painting to open it. |
| Browse a selection | Choose **Filter** to show a collection, or use the list icon to open its art index. |
| Leave the gallery | Choose **Exit gallery** to return to the entrance, or select **Collections** or **About** in the bottom navigation. |
| Look closer | Select **Fullscreen** in a viewing room. Use **Close** or Escape to leave the enlarged view. |
| Follow a collection | Open a room in the collection directory. Previous and next painting links follow that collection’s sequence. |
| Visit the source | **View original artwork** opens the individual National Gallery of Art record in a new tab. |

When visitors prefer reduced motion or WebGL is unavailable, the gallery presents the same paintings as a scrollable grid of links.

## Implementation

Next.js App Router and TypeScript provide stable, pre-rendered routes for every painting and collection. Tailwind CSS and component styles handle the layout. Cormorant Garamond and DM Sans are served locally through Fontsource.

The gallery draws the paintings and captions into one texture atlas. A Three.js fragment shader tiles the atlas across the viewport, bends the column rules, and darkens the corners. Pointer picking uses the same lens coordinates as the shader. The canvas redraws during interaction and while drag inertia settles. GSAP and ScrollTrigger coordinate the entrance artwork and text during scrolling.

| Location | Contents |
| --- | --- |
| `app/` | Homepage, collection routes, painting routes, and layout |
| `components/` | Entrance, editorial sections, gallery controls, and viewing room |
| `lib/gallery-scene.ts` | Artwork atlas, grid shader, pointer picking, and drag interaction |
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
