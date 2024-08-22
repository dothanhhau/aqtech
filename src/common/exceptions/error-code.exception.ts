export enum ErrorCode {
  // auth
  access_token_invalid = 'access_token_invalid',
  access_token_expired = 'access_token_expired',
  refresh_token_invalid = 'refresh_token_invalid',
  refresh_token_expired = 'refresh_token_expired',

  // brand
  brand_already_exists = 'brand_already_exists',
  brand_not_existed = 'brand_not_existed',
  create_brand_unsuccessful = 'create_brand_unsuccessful',
  update_brand_unsuccessful = 'update_brand_unsuccessful',
  email_is_incorrect = 'email_is_incorrect',
  website_is_incorrect = 'website_is_incorrect',
  industry_already_exists = 'industry_already_exists',
  sector_not_existed = 'sector_not_existed',
  brand_code_already_exists = 'brand_code_already_exists',

  // device
  device_not_existed = 'device_not_existed',
  create_device_unsuccessful = 'create_device_unsuccessful',
  update_device_unsuccessful = 'update_device_unsuccessful',

  // excel
  worksheet_not_found = 'worksheet_not_found',

  // language
  language_already_exists = 'language_already_exists',
  language_not_existed = 'language_not_existed',
  create_language_unsuccessful = 'create_language_unsuccessful',
  update_language_unsuccessful = 'update_language_unsuccessful',
  update_user_language_unsuccessful = 'update_user_language_unsuccessful',
  do_not_delete_default_language = 'do_not_delete_default_language',
  translation_already_exists = 'translation_already_exists',
  translation_not_existed = 'translation_not_existed',
  translation_creating_unsuccessful = 'translation_creating_unsuccessful',
  translation_updating_unsuccessful = 'translation_updating_unsuccessful',
  keyword_not_existed = 'keyword_not_existed',
  keyword_already_exists = 'keyword_already_exists',
  keyword_creating_unsuccessful = 'keyword_creating_unsuccessful',
  keyword_updating_unsuccessful = 'keyword_updating_unsuccessful',
  language_is_being_used = 'language_is_being_used',

  // media
  upload_file_not_success = 'upload_file_not_success',
  upload_image_not_success = 'upload_image_not_success',
  invalid_file_type = 'invalid_file_type',
  file_size_is_too_large = 'file_size_is_too_large',
  file_too_large = 'file_too_large',
  file_format_is_invalid = 'file_format_is_invalid',

  // permission
  permission_already_exists = 'permission_already_exists',
  permission_not_existed = 'permission_not_existed',
  create_permission_unsuccessful = 'create_permission_unsuccessful',
  update_permission_unsuccessful = 'update_permission_unsuccessful',

  // role
  role_already_exists = 'role_already_exists',
  role_not_existed = 'role_not_existed',
  role_is_being_used = 'role_is_being_used',
  create_role_unsuccessful = 'create_role_unsuccessful',
  update_role_unsuccessful = 'update_role_unsuccessful',
  not_allow_update_to_admin_role = 'not_allow_update_to_admin_role',

  // role permission
  create_role_permission_unsuccessful = 'create_role_permission_unsuccessful',

  // social
  social_exited = 'social_exited',
  page_not_exited = 'page_not_exited',
  post_not_exited = 'post_not_exited',
  social_not_exited = 'social_not_exited',
  social_detail_not_exited = 'social_detail_not_exited',
  social_cannot_unlink = 'social_cannot_unlink',
  create_social_unsuccessful = 'create_social_unsuccessful',
  get_page_id_unsuccessful = 'get_page_id_unsuccessful',
  get_data_unsuccessful = 'get_data_unsuccessful',
  execute_script_unsuccessful = 'execute_script_unsuccessful',
  tiktok_information_fail = 'tiktok_information_fail',
  read_tiktok_file_data_fail = 'read_tiktok_file_data_fail',
  crawl_tiktok_profile_data_fail = 'crawl_tiktok_profile_data_fail',
  crawl_tiktok_last_post_data_fail = 'crawl_tiktok_last_post_data_fail',
  crawl_tiktok_secuid_data_fail = 'crawl_tiktok_secuid_data_fail',
  crawl_youtube_profile_data_fail = 'crawl_youtube_profile_data_fail',
  crawl_youtube_latest_videos_data_fail = 'crawl_youtube_latest_videos_data_fail',
  crawl_youtube_video_statistics_fail = 'crawl_youtube_video_statistics_fail',
  read_instagram_file_data_fail = 'read_instagram_file_data_fail',
  crawl_instagram_profile_data_fail = 'crawl_instagram_profile_data_fail',
  facebook_page_id_not_found = 'facebook_page_id_not_found',
  crawl_facebook_profile_data_fail = 'crawl_facebook_profile_data_fail',
  crawl_facebook_latest_posts_data_fail = 'crawl_facebook_latest_posts_data_fail',
  search_facebook_page_fail = 'search_facebook_page_fail',
  filter_facebook_page_fail = 'filter_facebook_page_fail',
  get_list_facebook_page_fail = 'get_list_facebook_page_fail',
  this_channel_is_registed_by_another_user = 'this_channel_is_registed_by_another_user',

  // user
  username_password_incorrect = 'username_or_password_incorrect',
  user_need_change_password = 'user_need_change_password',
  user_not_verified = 'user_not_verified',
  user_has_been_verified = 'user_has_been_verified',
  user_not_existed = 'user_not_existed',
  user_is_being_used = 'user_is_being_used',
  user_already_exist = 'user_already_exist',
  user_code_already_exist = 'user_code_already_exist',
  user_email_already_exist = 'user_email_already_exist',
  user_has_been_suspended = 'user_has_been_suspended',
  user_unauthorized = 'user_unauthorized',
  user_forbidden = 'user_forbidden',
  user_does_not_have_permission = 'user_does_not_have_permission',
  user_does_not_have_permission_to_create_account = 'user_does_not_have_permission_to_create_account',
  the_maximum_number_of_accounts_is = 'the_maximum_number_of_accounts_is',
  re_entered_password_does_not_match = 're-entered_password_does_not_match',
  password_is_incorrect = 'password_is_incorrect',
  verification_code_not_existed = 'verification_code_not_existed',
  verification_not_expired = 'verification_not_expired',
  verification_expired = 'verification_expired',
  verification_incorrect = 'verification_incorrect',
  the_new_password_cannot_be_the_same_as_the_current_password = 'the_new_password_cannot_be_the_same_as_the_current_password',
  the_new_password_cannot_be_the_same_as_the_otp = 'the_new_password_cannot_be_the_same_as_the_otp',
  phone_number_is_incorrect = 'phone_number_is_incorrect',
  code_must_only_include_letters_and_numbers = 'code_must_only_include_letters_and_numbers',

  // kol
  kol_not_existed = 'kol_not_existed',

  // campaign
  create_campaign_unsuccessful = 'create_campaign_unsuccessful',
  send_email_campaign_unsuccessful = 'send_email_campaign_unsuccessful',
  campaign_not_existed = 'campaign_not_existed',
  start_date_incorrect = 'start_date_incorrect',
  campaign_id_is_not_empty = 'campaign_id_is_not_empty',
  create_campaign_post_unsuccessful = 'create_campaign_post_unsuccessful',
  campaign_post_not_existed = 'campaign_post_not_existed',
  url_is_incorrect = 'url_is_incorrect',

  // shortener
  shortener_not_existed = 'shortener_not_existed',

  // redis
  connect_to_redis_fail = 'connect_to_redis_fail',
  domain_not_allowed = 'domain_not_allowed',

  // setting
  department_not_existed = 'department_not_existed',
  studio_not_existed = 'studio_not_existed',
  update_setting_unsuccessfull = 'update_setting_unsuccessfull',

  // customer
  customer_code_already_exists = 'customer_code_already_exists',
  create_customer_unsuccessful = 'create_customer_unsuccessful',
  customer_not_existed = 'customer_not_existed',

  // office
  office_name_already_exists = 'office_name_already_exists',
  create_office_unsuccessfull = 'create_office_unsuccessfull',
  update_office_unsuccessfull = 'update_office_unsuccessfull',
  office_not_existed = 'office_not_existed',
  delete_office_unsuccessfull = 'delete_office_unsuccessfull',

  // exemption
  exemption_code_already_exists = 'exemption_code_already_exists',
  create_exemption_unsuccessfull = 'create_exemption_unsuccessfull',
  exemption_not_existed = 'exemption_not_existed',
  delete_exemption_unsuccessfull = 'delete_exemption_unsuccessfull',
  update_exemption_unsuccessfull = 'update_exemption_unsuccessfull',
  an_unexpected_error_occurred = 'an_unexpected_error_occurred',
  invalid_data = 'invalid_data',
  data_export_failed = 'data_export_failed',

  // semester
  wrong_semester = 'wrong_semester',

  // student
  student_code_already_exist = 'student_code_already_exists',
  student_already_exists = 'student_already_exists',
  student_not_existed = 'student_not_existed',
  tuition_revenue_not_existed = 'tuition_revenue_not_existed',
  tuition_exemption_not_existed = 'tuition_exemption_not_existed',
  revenue_not_existed = 'revenue_not_existed',
  EXPORT_FAILED = "EXPORT_FAILED",
  regime_not_existed = 'regime_not_existed',
  revenue_code_already_exists = 'revenue_code_already_exists',
  regime_name_already_exists = 'regime_name_already_exists',
  create_revenue_unsuccessfull = 'create_revenue_unsuccessfull',
  create_regime_unsuccessfull = 'create_regime_unsuccessfull',
  delete_revenue_unsuccessfull = 'delete_exemption_unsuccessfull',
  delete_regime_unsuccessfull = 'delete_exemption_unsuccessfull',
  update_regime_unsuccessfull = 'update_regime_unsuccessfull',
  tuition_cannot_be_deleted = 'tuition_cannot_be_deleted',

  // Payment
  receipt_not_existed = 'receipt_not_existed',
  receipt_not_editable = 'receipt_not_editable',
  payment_unsuccessful = 'payment_unsuccessful',

  // Receipt
  render_receipt_unsuccessfull = 'render_receipt_unsuccessfull',
  generate_receipt_unsuccessfull = 'generate_receipt_unsuccessfull',
  file_download_error = 'file_download_error',
  print_receipt_unsuccessfull = 'print_receipt_unsuccessfull',
  trans_id_existed = 'trans_id_existed',
  receipt_number_existed = 'receipt_number_existed',

  // Totol Tuition
  generate_total_tuition_unsuccessfull = 'generate_total_tuition_unsuccessfull',
  print_total_tuition_unsuccessfull = 'print_total_tuition_unsuccessfull',
}
