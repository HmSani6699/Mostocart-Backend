import { LandingPage } from "../models/LandingPage.js";
import { Product } from "../models/Product.js";

export const getLandingPage = async (req, res) => {
  try {
    const { slug } = req.params;
    let page = await LandingPage.findOne({ slug });
    if (!page) {
      return res.status(404).json({ success: false, message: "Landing page not found" });
    }
    // Retrieve linked product details
    const product = await Product.findOne({ slug: page.productId }) || await Product.findById(page.productId) || await Product.findOne({ slug: "lipoma-removal-spray" });
    
    // Sort visible sections by order
    const visibleSections = (page.sections || [])
      .filter((s) => s.isVisible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({
      success: true,
      data: {
        ...page,
        sections: visibleSections,
        product
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminLandingPage = async (req, res) => {
  try {
    const { slug } = req.params;
    let page = await LandingPage.findOne({ slug });
    if (!page) {
      return res.status(404).json({ success: false, message: "Landing page not found" });
    }
    const product = await Product.findOne({ slug: page.productId }) || await Product.findById(page.productId) || await Product.findOne({ slug: "lipoma-removal-spray" });
    
    // Return all sections (including hidden) sorted by order
    const sortedSections = [...(page.sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    res.json({
      success: true,
      data: {
        ...page,
        sections: sortedSections,
        product
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLandingPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, theme, sections, isPublished } = req.body;
    
    const update = {};
    if (title) update.title = title;
    if (theme) update.theme = theme;
    if (sections) update.sections = sections;
    if (isPublished !== undefined) update.isPublished = isPublished;

    const updated = await LandingPage.findOneAndUpdate({ slug }, update, { new: true, upsert: true });
    res.json({ success: true, data: updated, message: "Landing page saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reorderSections = async (req, res) => {
  try {
    const { slug } = req.params;
    const { sectionIds } = req.body; // array of section IDs in new order
    
    const page = await LandingPage.findOne({ slug });
    if (!page) {
      return res.status(404).json({ success: false, message: "Landing page not found" });
    }

    const sections = [...(page.sections || [])];
    const reordered = sections.map((sec) => {
      const newOrder = sectionIds.indexOf(sec.id);
      return {
        ...sec,
        order: newOrder !== -1 ? newOrder : sec.order
      };
    }).sort((a, b) => a.order - b.order);

    const updated = await LandingPage.findOneAndUpdate({ slug }, { sections: reordered }, { new: true });
    res.json({ success: true, data: updated, message: "Sections reordered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSection = async (req, res) => {
  try {
    const { slug, sectionId } = req.params;
    const page = await LandingPage.findOne({ slug });
    if (!page) {
      return res.status(404).json({ success: false, message: "Landing page not found" });
    }

    const sections = (page.sections || []).map((sec) => {
      if (sec.id === sectionId) {
        return { ...sec, isVisible: !sec.isVisible };
      }
      return sec;
    });

    const updated = await LandingPage.findOneAndUpdate({ slug }, { sections }, { new: true });
    res.json({ success: true, data: updated, message: "Section visibility updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

