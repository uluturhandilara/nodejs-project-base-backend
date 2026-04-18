var express = require("express");
var router = express.Router();

const Roles = require("../db/models/Roles");
const RolePrivileges = require("../db/models/RolePrivileges");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const role_privileges = require("../config/role_privileges");
const auth = require("../lib/auth")();
const config = require("../config");
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const UserRoles = require("../db/models/UserRoles");

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

router.get("/", async (req, res) => {
  try {
    let roles = await Roles.find({}).lean();

    for (let i = 0; i < roles.length; i++) {
      let permissions = await RolePrivileges.find({ role_id: roles[i]._id });
      roles[i].permissions = permissions;
    }

    res.json(Response.successResponse(roles));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", async (req, res) => {
  let body = req.body;
  try {
    if (!body.role_name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, [
          "role_name",
        ]),
      );
    if (
      !body.permissions ||
      !Array.isArray(body.permissions) ||
      body.permissions.length == 0
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, [
          "permissions",
          "Array",
        ]),
      );
    }

    let role = new Roles({
      role_name: body.role_name,
      is_active: true,
      created_by: req.user?.id,
    });

    await role.save();

    for (let i = 0; i < body.permissions.length; i++) {
      let priv = new RolePrivileges({
        role_id: role._id,
        permission: body.permissions[i],
        created_by: req.user?.id,
      });

      await priv.save();
    }

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.put("/update", async (req, res) => {
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

    let userRole = await UserRoles.findOne({
      user_id: req.user.id,
      role_id: body._id,
    });

    if (userRole) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language),
        i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language),
      );
    }

    let updates = {};

    if (body.role_name) updates.role_name = body.role_name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    if (
      body.permissions &&
      Array.isArray(body.permissions) &&
      body.permissions.length > 0
    ) {
      // update sorgusu attğımızda yetkileri değiştirmek isteyebiliriz bu noktada bir kontrol daha koymamız gerekiyor
      // bu kontrolde update etmeye çalıştığımız role ait olan yetkiler zaten db'de var
      // bunların yeni gönderilen yetkilerle karşılaştırılması gerekiyor

      // öncelikle update etmeye çalıştığımız role ait olan yetkileri buluyoruz
      let permissions = await RolePrivileges.find({ role_id: body._id });
      // yani db'de olan ama yeni gönderilen yetkilerde olmayan yetkileri buluyoruz
      // body.permissions => ["category_view", "user_add"]
      let removedPermissions = permissions.filter(
        (x) => !body.permissions.includes(x.permission),
      );
      // body permissions'ta olan ama db'de olmayan yetkileri buluyoruz
      // permissions => [{role_id: "abc", permission: "user_add", _id: "bcd"}];
      let newPermissions = body.permissions.filter(
        (x) => !permissions.map((p) => p.permission).includes(x),
      );

      if (removedPermissions.length > 0) {
        await RolePrivileges.deleteMany({
          _id: { $in: removedPermissions.map((x) => x._id) },
        });
      }

      if (newPermissions.length > 0) {
        for (let i = 0; i < newPermissions.length; i++) {
          let priv = new RolePrivileges({
            role_id: body._id,
            permission: newPermissions[i],
            created_by: req.user?.id,
          });

          await priv.save();
        }
      }
    }

    await Roles.updateOne({ _id: body._id }, updates);

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.delete("/delete", auth.checkRoles("role_delete"), async (req, res) => {
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

    await Roles.deleteOne({ _id: body._id });

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.get("/role_privileges", async (req, res) => {
  res.json(role_privileges);
});

module.exports = router;
