// import { Document, Model } from "mongoose";

// interface MonthData {
//   month: string;
//   count: number;
// }

// export async function generateLast12MonthsData<T extends Document>(
//   model: Model<T>
// ): Promise<MonthData[]> {
//   const last12Months: MonthData[] = [];
//   const currentDate = new Date();
//   currentDate.setDate(currentDate.getDate() + 1);

//   for (let i = 11; i >= 0; i--) {
//     const endDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       currentDate.getDate() - i * 28
//     );

//     const startDate = new Date(
//       endDate.getFullYear(),
//       endDate.getMonth(),
//       endDate.getDate() - 28
//     );

//     const monthYear = endDate.toLocaleString("default", {
//       month: "short",
//       year: "numeric",
//     });

//     const count = await model.countDocuments({
//       createdAt: {
//         $gte: startDate,
//         $lt: endDate,
//       },
//     });

//     last12Months.push({ month: monthYear, count });
//   }
  
//   return last12Months;
// }

import { Document, Model } from "mongoose";

interface MonthData {
  month: string;
  count: number;
}

export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>,
  dateField: string = "createdAt"
): Promise<MonthData[]> {
  const now = new Date();
  const lastYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const stats = await model.aggregate([
    {
      $match: {
        [dateField]: { $gte: lastYear, $lte: now },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: `$${dateField}` },
          month: { $month: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const results: MonthData[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthYear = d.toLocaleString("default", { month: "short", year: "numeric" });
    const found = stats.find(
      (s) => s._id.year === d.getFullYear() && s._id.month === d.getMonth() + 1
    );
    results.push({ month: monthYear, count: found ? found.count : 0 });
  }

  return results;
}
