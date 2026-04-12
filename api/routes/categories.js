var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");
const config = require("../config");
const auth = require("../lib/auth")();
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const emitter = require("../lib/Emitter");

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

router.get("/", auth.checkRoles("category_view"), async (req, res) => {
  try {
    // find ile db'ye select sorgusu yapılır.
    let categories = await Categories.find({});
    res.json(Response.successResponse(categories));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// auth.checkRoles("category_add"),
router.post("/add", async (req, res) => {
  let body = req.body;

  try {
    if (!body.name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "name",
        ]),
      );

    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id,
    });

    await category.save();

    AuditLogs.info(req.user?.email, "Categories", "Add", category);
    logger.info(req.user?.email, "Categories", "Add", category);
    emitter.getEmitter("notifications").emit("messages", {
      message: category.name + "is added",
    });

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    logger.error(req.user?.email, "Categories", "Add", error);
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.put("/update", auth.checkRoles("category_update"), async (req, res) => {
  let body = req.body;

  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "_id",
        ]),
      );

    if (!mongoose.isValidObjectId(body._id))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation error!",
        "Invalid _id format",
      );

    let updates = {};
    if (body.name) updates.name = body.name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation error!",
        "No fields to update (name or is_active)",
      );

    const result = await Categories.updateOne({ _id: body._id }, updates);

    AuditLogs.info(req.user?.email, "Categories", "Update", {
      _id: body._id,
      ...updates,
    });

    if (result.matchedCount === 0)
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Not found",
        "No category found with this _id",
      );

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.delete(
  "/delete",
  auth.checkRoles("category_delete"),
  async (req, res) => {
    let body = req.body;

    try {
      if (!body._id)
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
          i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
            "_id",
          ]),
        );

      await Categories.deleteOne({ _id: body._id });

      AuditLogs.info(req.user?.email, "Categories", "Delete", {
        _id: body._id,
      });

      res.json(Response.successResponse({ success: true }));
    } catch (error) {
      let errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  },
);

module.exports = router;
