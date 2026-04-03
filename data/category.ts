// data/category.ts

export type Category = {
  id: string;
  title: string;
};

export const categories: Category[] = [
  { id: "art", title: "Art" },
  { id: "modelling", title: "Modelling" },
  { id: "graphics", title: "Graphics" },

  // drawing & traditional art
  { id: "pencil-drawing", title: "Pencil Drawing" },
  { id: "ink-drawing", title: "Ink Drawing" },
  { id: "sketching", title: "Sketching" },

  // painting styles
  { id: "oil-painting", title: "Oil Painting" },
  { id: "watercolor", title: "Watercolor" },
  { id: "acrylic-painting", title: "Acrylic Painting" },
  { id: "digital-painting", title: "Digital Painting" },

  // digital creative fields
  { id: "illustration", title: "Illustration" },
  { id: "concept-art", title: "Concept Art" },
  { id: "3d-art", title: "3D Art" },

  // design fields
  { id: "branding", title: "Branding" },
  { id: "ui-ux", title: "UI/UX Design" },
  { id: "typography", title: "Typography" },

  // photography / modeling related
  { id: "photography", title: "Photography" },
  { id: "fashion-modelling", title: "Fashion Modelling" },
];
