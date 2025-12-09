import { CatchAsyncError } from './../middleware/catchAsyncError';
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import LayoutModel from "../models/layout.model"; // import your layout model
import cloudinary from "cloudinary";

// Create layout
// export const createLayout = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { type } = req.body;

//       if (!type) {
//         return next(new ErrorHandler("Type is required", 400));
//       }
//     const isTypeExist = await LayoutModel.findOne({type})
//     if(isTypeExist){
//         return next (new ErrorHandler(`${type} already exist`,400))
//     }
//       let layoutData: any = { type };

//      if (type === "Banner") {
//   const { image, title, subTitle } = req.body;

//   if (!image || !title || !subTitle) {
//     return res.status(400).json({
//       success: false,
//       message: "Image, title and subTitle are required",
//     });
//   }

//   const myCloud = await cloudinary.v2.uploader.upload(image, {
//     folder: "layout",
//   });

//   layoutData.banner = {
//     image: {
//       public_id: myCloud.public_id,
//       url: myCloud.secure_url,
//     },
//     title,
//     subTitle,
//   };
// }


//       if (type === "FAQ") {
//         const { faq } = req.body;
//         if (!faq || !Array.isArray(faq)) {
//           return next(new ErrorHandler("FAQ must be an array", 400));
//         }
//         layoutData.faq = faq;
//       }

//       if (type === "Categories") {
//         const { categories } = req.body;
//         if (!categories || !Array.isArray(categories)) {
//           return next(new ErrorHandler("Categories must be an array", 400));
//         }
//         layoutData.categories = categories;
//       }

//       const layout = await LayoutModel.create(layoutData);

//       res.status(201).json({
//         success: true,
//         layout,
//       });
//     } catch (err: any) {
//       return next(new ErrorHandler(err.message, 500));
//     }
//   }
// );

export const createLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { type } = req.body;

      if (!type) {
        return next(new ErrorHandler("Type is required", 400));
      }

      type = type.trim().charAt(0).toUpperCase() + type.trim().slice(1).toLowerCase();

      const allowedTypes = ["Banner", "Faq", "Categories"];

      if (!allowedTypes.includes(type)) {
        return next(
          new ErrorHandler("Invalid type. Allowed types: Banner, FAQ, Categories", 400)
        );
      }

      const isTypeExist = await LayoutModel.findOne({ type });
      if (isTypeExist) {
        return next(new ErrorHandler(`${type} already exists`, 400));
      }

      let layoutData: any = { type };

      if (type === "Banner") {
        const { image, title, subTitle } = req.body;

        if (!image || !title || !subTitle) {
          return next(
            new ErrorHandler("Image, title and subTitle are required for Banner", 400)
          );
        }

        const upload = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        layoutData.banner = {
          image: {
            public_id: upload.public_id,
            url: upload.secure_url,
          },
          title,
          subTitle,
        };
      }

      if (type === "Faq") {
        const { faq } = req.body;

        if (!faq || !Array.isArray(faq)) {
          return next(new ErrorHandler("FAQ must be an array", 400));
        }

        layoutData.faq = faq;
      }

      if (type === "Categories") {
        const { categories } = req.body;

        if (!categories || !Array.isArray(categories)) {
          return next(new ErrorHandler("Categories must be an array", 400));
        }

        layoutData.categories = categories;
      }

      const layout = await LayoutModel.create(layoutData);

      res.status(201).json({
        success: true,
        layout,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);
export const editLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
            const layoutData: any = await LayoutModel.findOne({ type });
      if (!layoutData) return next(new ErrorHandler(`${type} layout not found`, 404));
//       if (type === "Banner") {
//         const bannerData :any = await LayoutModel.findOne({type:"Banner"})
//         const { image, title, subTitle } = req.body;
      
//  if (bannerData?.banner?.image?.public_id) {
//     await cloudinary.v2.uploader.destroy(bannerData.banner.image.public_id);
//   }

//         const myCloud = await cloudinary.v2.uploader.upload(image, {
//           folder: "layout",
//         });

//         const banner = {
//           image: {
//             public_id: myCloud.public_id,
//             url: myCloud.secure_url,
//           },
//           title,
//           subTitle,
//         };
      
//       await LayoutModel.findByIdAndUpdate(bannerData._id,{banner})
//     }

     if (type === "FAQ") {
        const { faq } = req.body;
        if (!faq || !Array.isArray(faq))
          return next(new ErrorHandler("FAQ must be an array", 400));

        const updatedLayout = await LayoutModel.findByIdAndUpdate(
          layoutData._id,
          { faq },
          { new: true }
        );

        return res.status(200).json({
          success: true,
          layout: updatedLayout,
        });
      }

if (type === "Banner") {
  const bannerData: any = await LayoutModel.findOne({ type: "Banner" });
  const { image, title, subTitle } = req.body;

  const banner: any = {
    title,
    subTitle,
    image: bannerData.banner.image, // default (keep old image)
  };

  // Upload new image ONLY IF provided & is base64
  if (image && image.startsWith("data:")) {

    // Delete old image
    if (bannerData?.banner?.image?.public_id) {
      await cloudinary.v2.uploader.destroy(
        bannerData.banner.image.public_id
      );
    }

    // Upload new image
    const myCloud = await cloudinary.v2.uploader.upload(image, {
      folder: "layout",
    });

    banner.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  await LayoutModel.findByIdAndUpdate(bannerData._id, { banner }, { new: true });

  return res.status(200).json({
    success: true,
    message: "Banner updated successfully",
  });
}


      if (type === "Categories") {
        const { categories } = req.body;
        if (!categories || !Array.isArray(categories))
          return next(new ErrorHandler("Categories must be an array", 400));

        const updatedLayout = await LayoutModel.findByIdAndUpdate(
          layoutData._id,
          { categories },
          { new: true }
        );

        return res.status(200).json({
          success: true,
          layout: updatedLayout,
        });
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const getLayoutByType = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;

      if (!type) return next(new ErrorHandler("Type is required", 400));

      const layout = await LayoutModel.findOne({ type });

      if (!layout) return next(new ErrorHandler(`Layout of type ${type} not found`, 404));

      res.status(200).json({
        success: true,
        layout,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);