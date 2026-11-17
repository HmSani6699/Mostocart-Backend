import { connectDB, saveFallbackDb, getFallbackDb, isMongoDBActive } from "./db/connection.js";
import { Product } from "./models/Product.js";
import { LandingPage } from "./models/LandingPage.js";
import { Order } from "./models/Order.js";
import { Review } from "./models/Review.js";
import { Setting } from "./models/Setting.js";

export async function runSeed() {
  await connectDB();
  console.log("Seeding initial store data...");

  // 1. Initial Product Configuration
  const initialProduct = {
    name: "Lipoma Removal Spray",
    slug: "lipoma-removal-spray",
    brand: "South Moon",
    description: "ত্বকের অস্বস্তিদায়ক ফ্যাট লাম্প ও নডিউলার যত্নে বিশেষ ভেষজ ফর্মুলায় তৈরি টপিক্যাল স্প্রে। দ্রুত স্কিনে শোষিত হয় এবং নিয়মিত রুটিন অনুযায়ী ব্যবহারে আরামদায়ক অনুভূতি প্রদান করে।",
    regularPrice: 2970,
    salePrice: 1799,
    discountPercentage: 39,
    currency: "BDT",
    sku: "LIP-COMBO-03",
    stock: 150,
    isActive: true,
    mainImage: "/images/lipoma-combo-3.png",
    galleryImages: [
      "/images/lipoma-combo-3.png",
      "/images/lipoma-2-bottles.png",
      "/images/lipoma-1-bottle.png",
      "/images/lipoma-bottles-only.png"
    ],
    packages: [
      {
        id: "pkg-1",
        title: "(১ পিস) Lipoma Removal Spray",
        subtitle: "ট্রায়াল প্যাক — ১ বোতল (৫০ মিলি)",
        bottles: 1,
        regularPrice: 990,
        price: 689,
        discountPercent: 30,
        sku: "LIP-01",
        stock: 50,
        badge: "৩০% ছাড়",
        image: "/images/lipoma-1-bottle.png",
        isFeatured: false
      },
      {
        id: "pkg-2",
        title: "(২ পিস) Lipoma Removal Spray",
        subtitle: "জনপ্রিয় প্যাক — ২ বোতল (১০০ মিলি)",
        bottles: 2,
        regularPrice: 1980,
        price: 1299,
        discountPercent: 34,
        sku: "LIP-02",
        stock: 55,
        badge: "৩৪% ছাড়",
        image: "/images/lipoma-2-bottles.png",
        isFeatured: false
      },
      {
        id: "pkg-3",
        title: "(৩ পিস) Combo 3 — Lipoma Removal Spray",
        subtitle: "সম্পূর্ণ কোর্স — ৩ বোতল (১৫০ মিলি) সেরা সাশ্রয়ী অফার",
        bottles: 3,
        regularPrice: 2970,
        price: 1799,
        discountPercent: 39,
        sku: "LIP-03",
        stock: 45,
        badge: "৩৯% সেরা ছাড়",
        image: "/images/lipoma-combo-3.png",
        isFeatured: true
      }
    ],
    specifications: [
      { label: "নেট ওজন", value: "৫০ মিলি / ১.৬৯ ফ্লাউড আউন্স (প্রতি বোতল)" },
      { label: "ব্যবহারের ধরন", value: "টপিক্যাল এক্সটার্নাল স্প্রে (বাহ্যিক ব্যবহার)" },
      { label: "ফর্মুলা", value: "প্রাকৃতিক ভেষজ নির্যাস সমৃদ্ধ কোমল স্কিন কেয়ার" },
      { label: "উপযুক্ত স্থান", value: "ঘাড়, পিঠ, হাত, পা, পেট ও শরীরের ত্বক" },
      { label: "স্থায়িত্বকাল", value: "উৎপাদন থেকে ৩ বছর" },
      { label: "উৎপাদন মান", value: "কোয়ালিটি স্ট্যান্ডার্ড সার্টিফাইড" }
    ],
    ingredients: "সফ্রন (Saffron), জিনসেং নির্যাস, প্রাকৃতিক কর্পূর ও ভেষজ এসেন্সিয়াল তেল। ত্বকের জন্য শতভাগ নিরাপদ ও কোমল।",
    usageInstructions: "১. আক্রান্ত স্থান পরিষ্কার ও শুকনো রাখুন।\n২. দিনে ১-২ বার স্প্রে করুন।\n৩. আলতোভাবে ১-২ মিনিট ম্যাসাজ করুন যাতে ত্বকে সম্পূর্ণ শোষিত হয়।\n৪. নিয়মিত যত্নের অংশ হিসেবে ব্যবহার করুন।",
    warnings: "শুধুমাত্র বাহ্যিক ব্যবহারের জন্য প্রযোজ্য। চোখ বা উন্মুক্ত ক্ষতে ব্যবহার করবেন না। অস্বাভাবিক বা দ্রুত বর্ধনশীল কোনো লাম্পের ক্ষেত্রে রেজিস্টার্ড ডাক্তারের পরামর্শ নিন।",
    medicalDisclaimer: "জরুরি চিকিৎসা বিজ্ঞপ্তি: এই স্প্রেটি ত্বক ও লাম্পের উপরিভাগের অস্বস্তি কমাতে সহায়ক একটি কেয়ার প্রোডাক্ট। এটি কোনো প্রেসক্রিপশন সার্জিক্যাল ট্রিটমেন্টের বিকল্প নয়। শরীরের যেকোনো অস্বাভাবিক পিণ্ড বা ফোলাভাব বিশেষজ্ঞ চিকিৎসকের মাধ্যমে পরীক্ষা করানো নিরাপদ।"
  };

  // 2. Landing Page Configuration with Sections
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);

  const initialLandingPage = {
    title: "Lipoma Removal Spray — অফিশিয়াল ল্যান্ডিং পেজ",
    slug: "lipoma-removal-spray",
    productId: "lipoma-removal-spray",
    isPublished: true,
    theme: {
      primaryColor: "#F45100",
      darkTextColor: "#26394B",
      backgroundColor: "#F8F9FB",
      whiteColor: "#FFFFFF"
    },
    sections: [
      {
        id: "sec-announcement",
        type: "announcement",
        order: 0,
        isVisible: true,
        title: "অফার ঘোষণা",
        content: {
          text: "🔥 মেগা ধামাকা অফার: ৩টি বোতল Combo প্যাকে ৩৯% পর্যন্ত বিশেষ মূল্যছাড়! সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা।",
          showTimer: true,
          bgColor: "#F45100",
          textColor: "#FFFFFF"
        }
      },
      {
        id: "sec-hero",
        type: "hero",
        order: 1,
        isVisible: true,
        title: "হিরো সেকশন",
        content: {
          badge: "প্রাকৃতিক স্কিন কেয়ার রুটিন",
          headline: "ছোট Lump নিয়ে চিন্তা না করে, শুরু করুন সঠিক Care Routine",
          subheadline: "অপারেশনের ঝামেলা ছাড়া বাসায় বসেই ত্বকের অস্বস্তিদায়ক ফ্যাট লাম্প ও নডিউলের নিয়মিত যত্নে শতভাগ প্রাকৃতিক উপাদানে প্রস্তুত Lipoma Removal Spray।",
          ctaButtonText: "🛒 এখনই অর্ডার করুন",
          regularPrice: 2970,
          offerPrice: 1799,
          discountBadge: "৩৯% ছাড়",
          ratingText: "৫,০০০+ সন্তুষ্ট গ্রাহকের পছন্দ"
        }
      },
      {
        id: "sec-countdown",
        type: "countdown",
        order: 2,
        isVisible: true,
        title: "লিমিটেড টাইম অফার টাইমার",
        content: {
          title: "অফারটি শেষ হতে আর বাকি মাত্র",
          targetDate: futureDate.toISOString(),
          regularPrice: 2970,
          offerPrice: 1799,
          buttonText: "🛒 এখনই অর্ডার করুন"
        }
      },
      {
        id: "sec-video",
        type: "video",
        order: 3,
        isVisible: true,
        title: "প্রোডাক্ট পরিচিতি ভিডিও",
        content: {
          title: "Lipoma Removal Spray কীভাবে কাজ করে ও ব্যবহারের নিয়ম দেখুন",
          subtitle: "সহজ ব্যবহার পদ্ধতি ও কার্যকারিতার বাস্তব ভিডিও ডেমো",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          thumbnailUrl: "/images/lipoma-combo-3.png"
        }
      },
      {
        id: "sec-packages",
        type: "packages",
        order: 4,
        isVisible: true,
        title: "প্যাকেজ নির্বাচন ও গ্যালারি",
        content: {
          title: "আপনার সুবিধামতো সঠিক প্যাকেজটি বেছে নিন",
          subtitle: "সব প্যাকেজেই পাচ্ছেন শতভাগ আসল পণ্য ও ক্যাশ অন ডেলিভারি সুবিধা",
          featuredPackageId: "pkg-3",
          ctaText: "➔ অর্ডার করতে ক্লিক করুন"
        }
      },
      {
        id: "sec-benefits",
        type: "benefits",
        order: 5,
        isVisible: true,
        title: "সুবিধাসমূহ",
        content: {
          title: "কেন হাজারো মানুষ বেছে নিচ্ছে Lipoma Removal Spray?",
          subtitle: "দৈনন্দিন জীবনে ফ্যাট লাম্প ও নডিউলার অস্বস্তি কমাতে প্রাকৃতিক ও নিরাপদ উপায়",
          items: [
            {
              title: "অপারেশনের ঝামেলা ছাড়াই সহজ সমাধান",
              description: "কোনো জটিলতা ছাড়াই ঘরে বসেই নিজে নিজে সহজে ব্যবহার করতে পারেন।"
            },
            {
              title: "Lipoma ও Fat Lump টার্গেট করে কাজ করে",
              description: "নিয়মিত ব্যবহারে লাম্পের উপরিভাগের টানটান অনুভূতি ও অস্বস্তি ধীরে ধীরে কমাতে সহায়তা করে।"
            },
            {
              title: "100% Herbal & Skin Friendly Formula",
              description: "প্রাকৃতিক উপাদানে তৈরি যা ত্বকের জন্য Gentle Care প্রদান করে এবং কোনো জ্বালাপোড়া করে না।"
            },
            {
              title: "দ্রুত শোষিত হয় (Fast Absorption)",
              description: "কোনো প্রকার Sticky বা আঠালো ভাব ছাড়াই কয়েক মুহূর্তেই স্কিনে সম্পূর্ণ Absorb হয়ে যায়।"
            },
            {
              title: "দৈনন্দিন ব্যবহারে নিরাপদ",
              description: "প্রতিদিন নিয়মিত ব্যবহারের জন্য প্রস্তুতকৃত একটি Safe & Effective ভেষজ কেয়ার ফর্মুলা।"
            },
            {
              title: "শরীরের বিভিন্ন স্থানে ব্যবহারযোগ্য",
              description: "ঘাড়, পিঠ, পেট, হাত কিংবা পায়ের যেকোনো ফ্যাট লাম্পের জায়গায় নির্বিঘ্নে ব্যবহার করা যায়।"
            },
            {
              title: "ব্যবহার করা অত্যন্ত সহজ",
              description: "শুধু প্রয়োজন মতো Spray করুন এবং আলতো করে কিছুক্ষণ Massage করুন।"
            },
            {
              title: "অস্বস্তিদায়ক ফিলিং থেকে স্বস্তি দেয়",
              description: "Unwanted Lump এর কারণে সৃষ্ট ভারি ভাব ও অস্বস্তি কমাতে সহায়তা করে।"
            },
            {
              title: "No Harsh Chemicals",
              description: "কোনো ক্ষতিকর কেমিক্যাল বা প্যারাবেন ছাড়া শতভাগ Natural Care Solution!"
            },
            {
              title: "Home Delivery + Cash On Delivery",
              description: "পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধাসহ সারা বাংলাদেশে দ্রুত হোম ডেলিভারি।"
            }
          ]
        }
      },
      {
        id: "sec-trustBadges",
        type: "trustBadges",
        order: 6,
        isVisible: true,
        title: "কেন আমাদের থেকে কিনবেন",
        content: {
          title: "কেন আমাদের থেকে কিনবেন?",
          badges: [
            {
              title: "১০০% অরিজিনাল প্রোডাক্ট গ্যারান্টি",
              description: "আমরা সবসময় Trusted & Quality Checked অরিজিনাল আমদানি করা প্রোডাক্ট সরবরাহ করি।"
            },
            {
              title: "কাস্টমার সাপোর্ট সবসময় প্রস্তুত",
              description: "অর্ডার বা প্রোডাক্ট সম্পর্কিত যেকোনো প্রয়োজনে আমাদের হেল্পলাইন ২৪ ঘণ্টা আপনার পাশে আছে।"
            },
            {
              title: "সহজ অর্ডার, ঘরে ডেলিভারি",
              description: "কোনো অগ্রিম পেমেন্ট ছাড়া Cash on Delivery সুবিধায় নিশ্চিন্তে ঘরে বসেই পণ্য গ্রহণ করুন।"
            }
          ]
        }
      },
      {
        id: "sec-reviews",
        type: "reviews",
        order: 7,
        isVisible: true,
        title: "গ্রাহক মতামত ও রিভিউ",
        content: {
          title: "আমাদের প্রতি আস্থা রেখেছেন হাজারো গ্রাহক",
          subtitle: "★★★★★ ৫,০০০+ পরিবার নির্ভরযোগ্যভাবে নিয়মিত ব্যবহার করছেন",
          allowSubmission: true
        }
      },
      {
        id: "sec-medicalNotice",
        type: "medicalNotice",
        order: 8,
        isVisible: true,
        title: "স্বাস্থ্য ও চিকিৎসা সচেতনতা বিজ্ঞপ্তি",
        content: {
          title: "স্বাস্থ্য সচেতনতা ও প্রয়োজনীয় পরামর্শ",
          noticeText: "লিপোমা মূলত ত্বকের নিচে চর্বির একটি সৌম্য (Benign) পিণ্ড। এটি সাধারণত ক্ষতিকর নয়। তবে শরীরের যেকোনো স্থানে নতুন বা দ্রুত বর্ধনশীল পিণ্ড দেখা দিলে অবিলম্বে একজন রেজিস্টার্ড ডাক্তারের পরামর্শ নিন। এই স্প্রেটি ত্বক ও লাম্পের স্বাভাবিক আরাম ও বাহ্যিক যত্নের জন্য সহায়ক, এটি কোনো প্রেসক্রিপশন সার্জিক্যাল চিকিৎসার বিকল্প নয়।"
        }
      },
      {
        id: "sec-orderForm",
        type: "orderForm",
        order: 9,
        isVisible: true,
        title: "চেকআউট ও অর্ডার ফর্ম",
        content: {
          formTitle: "অর্ডার করতে নিচের ফর্মটি সঠিক তথ্য দিয়ে পূরণ করুন",
          insideDhakaFee: 70,
          outsideDhakaFee: 120,
          buttonText: "অর্ডার কনফার্ম করুন ✔",
          deliveryNote: "পণ্য হাতে পেয়ে ডেলিভারিম্যানকে মূল্য পরিশোধ করার শতভাগ নিশ্চয়তা।"
        }
      },
      {
        id: "sec-faq",
        type: "faq",
        order: 10,
        isVisible: true,
        title: "সাধারণ প্রশ্নোত্তর (FAQ)",
        content: {
          title: "যেসব প্রশ্ন সবচেয়ে বেশি করা হয় (FAQ)",
          faqs: [
            {
              question: "এই Spray কি সত্যিই কাজ করে?",
              answer: "হ্যাঁ, এটি একটি পরীক্ষিত ভেষজ ফর্মুলা যা ত্বকের ফ্যাট লাম্প ও নডিউলার স্থানের অস্বস্তি উপশমে সহায়তা করে। নিয়মিত ব্যবহার করলে ত্বক মসৃণ ও স্বস্তিদায়ক থাকে।"
            },
            {
              question: "অপারেশনের জায়গা ছাড়াই ব্যবহার করা যাবে?",
              answer: "অবশ্যই! এটি কোনো সার্জিক্যাল কাটাছেঁড়া ছাড়াই বাহ্যিকভাবে ব্যবহারের জন্য তৈরি। আক্রান্ত স্থানে শুধু স্প্রে করে আলতো হাতে ম্যাসাজ করে নিন।"
            },
            {
              question: "কতদিন ব্যবহার করলে ভালো ফল পাওয়া যেতে পারে?",
              answer: "সাধারণত ভালো ফলাফলের জন্য ২ থেকে ৩ বোতলের একটি সম্পূর্ণ কোর্স (Combo 3) নিয়মিত ব্যবহারের পরামর্শ দেওয়া হয়।"
            },
            {
              question: "কোন বয়সে এটি ব্যবহার করা উচিত?",
              answer: "প্রাপ্তবয়স্ক (১৮ বছর বা তার বেশি) যেকোনো নারী ও পুরুষ এই স্প্রেটি নিয়মমাফিক ব্যবহার করতে পারবেন।"
            }
          ]
        }
      },
      {
        id: "sec-footer",
        type: "footer",
        order: 11,
        isVisible: true,
        title: "ফুটার",
        content: {
          hotline: "01905-761214",
          email: "contact@nobonir.com",
          address: "Dhaka, Bangladesh",
          copyrightText: "© ২০২৬ Nobonir Online Shopping. All rights reserved.",
          returnPolicyText: "পণ্য হাতে পেয়ে চেক করে নেওয়ার সুবিধা এবং ত্রুটিপূর্ণ পণ্যে সহজ রিটার্ন পলিসি।"
        }
      }
    ]
  };

  // 3. Initial Sample Authentic Reviews
  const initialReviews = [
    {
      productId: "lipoma-removal-spray",
      customerName: "আব্দুল হক",
      phone: "01712***456",
      district: "ঢাকা",
      rating: 5,
      comment: "আমার ঘাড়ের পেছনে ছোট একটা ফ্যাট লাম্প ছিল যা মাঝে মাঝে অস্বস্তি দিত। ২ বোতল ব্যবহারের পর অনেক হালকা ও আরাম লাগছে। ধন্যবাদ নবনীড়!",
      packageBought: "Combo 3 (3 Bottles)",
      isVerifiedBuyer: true,
      isApproved: true
    },
    {
      productId: "lipoma-removal-spray",
      customerName: "মো. জিয়াউর রহমান",
      phone: "01819***789",
      district: "চট্টগ্রাম",
      rating: 5,
      comment: "আলহামদুলিল্লাহ আল্লাহর রহমতে উপকার পেয়েছি। স্প্রেটা একদম নন-স্টিকি, খুব দ্রুত ত্বকে শুকিয়ে যায়।",
      packageBought: "Combo 3 (3 Bottles)",
      isVerifiedBuyer: true,
      isApproved: true
    },
    {
      productId: "lipoma-removal-spray",
      customerName: "এমরান হোসেন আইয়ুব",
      phone: "01911***321",
      district: "সিলেট",
      rating: 5,
      comment: "ভাই আমি নিয়মিত ১ মাস ব্যবহার করছি, আগে থেকে অস্বস্তিকর টানটান ভাবটা অনেকটাই কমে এসেছে। ক্যাশ অন ডেলিভারিতে দ্রুত পেয়েছিলাম।",
      packageBought: "2 Bottles Pack",
      isVerifiedBuyer: true,
      isApproved: true
    },
    {
      productId: "lipoma-removal-spray",
      customerName: "সুপ্রিয়া দে",
      phone: "01625***900",
      district: "রাজশাহী",
      rating: 5,
      comment: "প্রোডাক্টের প্যাকেজিং খুব ভালো ছিল এবং ১০০% অরিজিনাল সাউথ মুন ব্যান্ডের প্রোডাক্ট। ব্যবহারে কোনো জ্বালাপোড়া নেই।",
      packageBought: "1 Bottle Trial",
      isVerifiedBuyer: true,
      isApproved: true
    }
  ];

  // 4. Initial Sample Orders (Real DB Records across All Pipeline States)
  const initialOrders = [
    {
      orderId: "LIP-261109-8812",
      customerName: "তানভীর হাসান",
      phone: "01711223344",
      fullAddress: "বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা",
      district: "ঢাকা",
      upazila: "ধানমন্ডি",
      deliveryZone: "inside_dhaka",
      deliveryCharge: 70,
      selectedPackage: {
        id: "pkg-3",
        title: "(৩ পিস) Combo 3 — Lipoma Removal Spray",
        bottles: 3,
        price: 1799,
        sku: "LIP-03"
      },
      quantity: 1,
      subtotal: 1799,
      grandTotal: 1869,
      orderNotes: "অফিস টাইমে ডেলিভারি দিলে ভালো হয়।",
      orderStatus: "Delivered",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Collected",
      courierInfo: {
        provider: "Steadfast",
        consignmentId: "CN-STE-409121",
        trackingCode: "TRK88491023",
        status: "Delivered",
        notes: "Customer received and paid full cash"
      },
      landingPageSlug: "lipoma-removal-spray",
      timeline: [
        { status: "Pending", note: "Order placed online", timestamp: new Date(Date.now() - 86400000 * 3) },
        { status: "Confirmed", note: "Call verified by admin", timestamp: new Date(Date.now() - 86400000 * 3 + 3600000) },
        { status: "Shipped", note: "Handed over to Steadfast Courier", timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: "Delivered", note: "Successfully delivered to customer", timestamp: new Date(Date.now() - 86400000) }
      ]
    },
    {
      orderId: "LIP-261109-7741",
      customerName: "মাহমুদুল হক",
      phone: "01822334455",
      fullAddress: "জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম",
      district: "চট্টগ্রাম",
      upazila: "নাসিরাবাদ",
      deliveryZone: "outside_dhaka",
      deliveryCharge: 120,
      selectedPackage: {
        id: "pkg-3",
        title: "(৩ পিস) Combo 3 — Lipoma Removal Spray",
        bottles: 3,
        price: 1799,
        sku: "LIP-03"
      },
      quantity: 1,
      subtotal: 1799,
      grandTotal: 1919,
      orderNotes: "",
      orderStatus: "Shipped",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      courierInfo: {
        provider: "Steadfast",
        consignmentId: "CN-STE-409199",
        trackingCode: "TRK99201948",
        status: "In Transit",
        notes: "Dispatched to Chittagong Hub"
      },
      landingPageSlug: "lipoma-removal-spray",
      timeline: [
        { status: "Pending", note: "Order placed", timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: "Confirmed", note: "Customer confirmed over call", timestamp: new Date(Date.now() - 86400000 * 1.5) },
        { status: "Shipped", note: "Consignment created on Steadfast", timestamp: new Date(Date.now() - 86400000) }
      ]
    },
    {
      orderId: "LIP-261109-6632",
      customerName: "ফারহানা আক্তার",
      phone: "01933445566",
      fullAddress: "উপশহর ব্লক-বি, সিলেট সদর",
      district: "সিলেট",
      upazila: "সিলেট সদর",
      deliveryZone: "outside_dhaka",
      deliveryCharge: 120,
      selectedPackage: {
        id: "pkg-2",
        title: "(২ পিস) Lipoma Removal Spray",
        bottles: 2,
        price: 1299,
        sku: "LIP-02"
      },
      quantity: 1,
      subtotal: 1299,
      grandTotal: 1419,
      orderNotes: "জরুরি ডেলিভারি প্রয়োজন।",
      orderStatus: "Confirmed",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      courierInfo: {
        provider: "Steadfast",
        consignmentId: "",
        trackingCode: "",
        status: "Pending Dispatch"
      },
      landingPageSlug: "lipoma-removal-spray",
      timeline: [
        { status: "Pending", note: "Order placed", timestamp: new Date(Date.now() - 3600000 * 10) },
        { status: "Confirmed", note: "Admin confirmed order", timestamp: new Date(Date.now() - 3600000 * 8) }
      ]
    },
    {
      orderId: "LIP-261109-5510",
      customerName: "শফিকুল ইসলাম",
      phone: "01799887766",
      fullAddress: "সেক্টর ১০, উত্তরা, ঢাকা",
      district: "ঢাকা",
      upazila: "উত্তরা",
      deliveryZone: "inside_dhaka",
      deliveryCharge: 70,
      selectedPackage: {
        id: "pkg-3",
        title: "(৩ পিস) Combo 3 — Lipoma Removal Spray",
        bottles: 3,
        price: 1799,
        sku: "LIP-03"
      },
      quantity: 1,
      subtotal: 1799,
      grandTotal: 1869,
      orderNotes: "",
      orderStatus: "Pending",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      courierInfo: {
        provider: "Steadfast",
        consignmentId: "",
        trackingCode: "",
        status: "Not Dispatched"
      },
      landingPageSlug: "lipoma-removal-spray",
      timeline: [
        { status: "Pending", note: "নতুন অর্ডার প্লেস করা হয়েছে", timestamp: new Date() }
      ]
    }
  ];

  // 5. Initial Store Settings
  const initialSettings = {
    storeName: "Nobonir Online Shop",
    tagline: "Trusted Health & Wellness Products in Bangladesh",
    hotline: "01905-761214",
    whatsappNumber: "01905761214",
    email: "contact@nobonir.com",
    address: "House 24, Road 5, Dhanmondi, Dhaka 1205",
    deliveryInsideDhaka: 70,
    deliveryOutsideDhaka: 120,
    defaultCourier: "Steadfast"
  };

  // Execute Seed
  await Product.findOneAndUpdate({ slug: "lipoma-removal-spray" }, initialProduct, { upsert: true });
  await LandingPage.findOneAndUpdate({ slug: "lipoma-removal-spray" }, initialLandingPage, { upsert: true });
  await Setting.updateSettings(initialSettings);

  for (const rev of initialReviews) {
    const existing = await Review.find({ customerName: rev.customerName });
    if (existing.length === 0) {
      await Review.create(rev);
    }
  }

  for (const ord of initialOrders) {
    const existing = await Order.findOne({ orderId: ord.orderId });
    if (!existing) {
      await Order.create(ord);
    }
  }

  console.log("Seeding completed successfully!");
}

if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  runSeed().then(() => {
    console.log("Seed script finished.");
    process.exit(0);
  });
}

