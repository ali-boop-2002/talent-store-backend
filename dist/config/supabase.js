"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORTFOLIO_BUCKET = exports.PROFILE_PICS_BUCKET = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Change this
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
// Storage bucket name
exports.PROFILE_PICS_BUCKET = "profile-pic";
exports.PORTFOLIO_BUCKET = "portfolio";
//# sourceMappingURL=supabase.js.map