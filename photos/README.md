# Fotos (Originale)

Originalfotos für Level 3. Die Zuordnung Datei -> Bild-ID steht in
`content/photos.ts`; die Dateinamen dürfen die Lösung enthalten, weil nur die
neutralen IDs nach `public/` gelangen:

    photos/<datei>  →  public/zoom/<id>_1.jpg, _2.jpg, _3.jpg   (Zoom)
    photos/<datei>  →  public/age/<id>.jpg                       (Alter)

Erzeugen mit `npm run photos`. Die Ausgaben in `public/` werden mit
committet – Vercel führt das Script nicht aus.
