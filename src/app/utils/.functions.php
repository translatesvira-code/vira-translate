<?php
/**
 * Vira Translate - Custom Functions
 * WordPress REST API Integration for Translation Management System
 */

// Enable CORS for all requests
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce');
        header('Access-Control-Max-Age: 86400');
        exit();
    }
});

// Add CORS headers to all REST API responses
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce');
        header('Access-Control-Max-Age: 86400');
        return $value;
    });
});

/* --------------------------
 * 🔹 Custom REST API for Settings
 * -------------------------- */

// Register custom settings endpoint
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/settings', array(
        'methods' => 'GET',
        'callback' => 'get_vira_settings',
        'permission_callback' => function () {
            return true; // Allow public access for now
        }
    ));
    
    register_rest_route('custom/v1', '/settings', array(
        'methods' => 'POST',
        'callback' => 'save_vira_settings',
        'permission_callback' => function () {
            return true; // Allow public access for now
        }
    ));
});

function get_vira_settings() {
    $settings = get_option('vira_translate_settings', array());
    
    // Return default settings if none exist
    if (empty($settings)) {
        $settings = array(
            'services' => array(
                array('id' => '1', 'name' => 'تائیدات دادگستری', 'price' => 0, 'additionType' => 'percentage', 'additionValue' => 0, 'total' => 0),
                array('id' => '2', 'name' => 'تائیدات خارجه', 'price' => 0, 'additionType' => 'percentage', 'additionValue' => 0, 'total' => 0),
                array('id' => '3', 'name' => 'برابر اصل', 'price' => 0, 'additionType' => 'percentage', 'additionValue' => 0, 'total' => 0)
            ),
            'categories' => array(
                array('id' => '1', 'name' => 'هویتی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0, 'items' => array()),
                array('id' => '2', 'name' => 'تحصیلی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0, 'items' => array()),
                array('id' => '3', 'name' => 'مالی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0, 'items' => array()),
                array('id' => '4', 'name' => 'پزشکی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0, 'items' => array(
                    array('id' => '4-1', 'name' => 'برگه آزمایش پزشکی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '4-2', 'name' => 'نسخه پزشک', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '4-3', 'name' => 'گواهی پزشکی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '4-4', 'name' => 'گزارش پزشکی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '4-5', 'name' => 'گزارش پزشکی قانونی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0)
                )),
                array('id' => '5', 'name' => 'اسناد', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0, 'items' => array(
                    array('id' => '5-1', 'name' => 'سند مالکیت تک‌برگی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-2', 'name' => 'سند مالکیت دفترچه‌ای', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-3', 'name' => 'سند وسایل نقلیه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-4', 'name' => 'مبایعه‌نامه/اجاره‌نامه با کد رهگیری', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-5', 'name' => 'مبایعه‌نامه/اجاره‌نامه/صلح‌نامه محضری', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-6', 'name' => 'استعلامات اداره ثبت', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-7', 'name' => 'گزارش ارزیابی و کارشناسی املاک', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-8', 'name' => 'اوراق محضری (تعهدنامه، اقرارنامه، استشهادیه)', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-9', 'name' => 'وکالت‌نامه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-10', 'name' => 'اوراق قضائی (حصر وراثت، دادنامه)', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-11', 'name' => 'سند نوع ۱', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '5-12', 'name' => 'سند نوع ۲', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0)
                )),
                array('id' => '6', 'name' => 'کاری', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0, 'items' => array(
                    array('id' => '6-1', 'name' => 'گواهی اشتغال', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-2', 'name' => 'حکم کارگزینی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-3', 'name' => 'حکم بازنشستگی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-4', 'name' => 'حکم افزایش حقوق', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-5', 'name' => 'حکم اعضای هیئت علمی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-6', 'name' => 'فیش حقوقی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-7', 'name' => 'سابقه بیمه تأمین اجتماعی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-8', 'name' => 'برگه مرخصی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-9', 'name' => 'کارت شناسایی شغلی (کارت بازرگانی، مباشرت، نظام پزشکی)', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-10', 'name' => 'پروانه دائم پزشکی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-11', 'name' => 'پروانه وکالت', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-12', 'name' => 'پروانه مهندسی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-13', 'name' => 'پروانه مطب', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-14', 'name' => 'پروانه مسئولیت فنی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-15', 'name' => 'دفترچه وکالت/ کارشناسی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-16', 'name' => 'جواز کسب', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-17', 'name' => 'مدرک شغلی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-18', 'name' => 'گواهی شغلی متفرقه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '6-19', 'name' => 'دفترچه بیمه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0)
                )),
                array('id' => '7', 'name' => 'آموزشی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0, 'items' => array(
                    array('id' => '7-1', 'name' => 'کارنامه توصیفی ابتدائی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-2', 'name' => 'ریزنمرات تحصیلی آموزش-پرورش (ابتدائی- متوسطه)', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-3', 'name' => 'ریزنمرات دبیرستان (کل)', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-4', 'name' => 'دیپلم پایان تحصیلات متوسطه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-5', 'name' => 'گواهی پایان دوره پیش‌دانشگاهی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-6', 'name' => 'دانش‌نامه (دانشگاهی)', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-7', 'name' => 'ریزنمرات دانشگاه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-8', 'name' => 'گواهی اشتغال به تحصیل', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-9', 'name' => 'گواهی ریزنمرات', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-10', 'name' => 'سرفصل دروس', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-11', 'name' => 'گواهی فنی-حرفه‌ای', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-12', 'name' => 'گواهی حوزه علمیه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-13', 'name' => 'گواهی رتبه', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-14', 'name' => 'گواهی آموزش دوره‌های مراکز دولتی یا خصوصی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0),
                    array('id' => '7-15', 'name' => 'مدرک آموزشی', 'translationPrice' => 0, 'officeServicePrice' => 0, 'hasInquiry' => false, 'hasInquiry' => false, 'inquiryPrices' => array(), 'total' => 0)
                ))
            )
        );
    }
    
    return $settings;
}

function save_vira_settings($request) {
    $settings = $request->get_json_params();
    
    // Save to WordPress options
    $result = update_option('vira_translate_settings', $settings);
    
    if ($result) {
        return array('success' => true, 'message' => 'تنظیمات با موفقیت ذخیره شد');
    } else {
        return new WP_Error('save_failed', 'خطا در ذخیره تنظیمات', array('status' => 500));
    }
}

/* --------------------------
 * 🔹 Custom Post Type for Clients
 * -------------------------- */

// Register Clients custom post type
add_action('init', function() {
    register_post_type('clients', array(
        'labels' => array(
            'name' => 'Clients',
            'singular_name' => 'Client',
            'add_new' => 'Add New Client',
            'add_new_item' => 'Add New Client',
            'edit_item' => 'Edit Client',
            'new_item' => 'New Client',
            'view_item' => 'View Client',
            'search_items' => 'Search Clients',
            'not_found' => 'No clients found',
            'not_found_in_trash' => 'No clients found in trash'
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'custom-fields'    ),
    'show_in_rest' => true, // Enable REST API
    'rest_base' => 'clients', // Endpoint name
    'capability_type' => 'post',
    'capabilities' => array(
        'create_posts' => 'edit_posts',
        'delete_posts' => 'edit_posts',
        'delete_post' => 'edit_posts',
        'edit_posts' => 'edit_posts',
        'edit_post' => 'edit_posts',
    ),
        'map_meta_cap' => true,
    ));
});

// Add meta fields to REST API for Clients
add_action('rest_api_init', function() {
    register_rest_field('clients', 'meta', array(
        'get_callback' => function($post) {
            return array(
                'client_name' => get_post_meta($post['id'], 'client_name', true),
                'client_first_name' => get_post_meta($post['id'], 'client_first_name', true),
                'client_last_name' => get_post_meta($post['id'], 'client_last_name', true),
                'client_company' => get_post_meta($post['id'], 'client_company', true),
                'client_phone' => get_post_meta($post['id'], 'client_phone', true),
                'client_email' => get_post_meta($post['id'], 'client_email', true),
                'client_address' => get_post_meta($post['id'], 'client_address', true),
                'client_national_id' => get_post_meta($post['id'], 'client_national_id', true),
                'client_code' => get_post_meta($post['id'], 'client_code', true),
                'service_type' => get_post_meta($post['id'], 'service_type', true),
                'client_type' => get_post_meta($post['id'], 'client_type', true),
                'client_registration_date' => get_post_meta($post['id'], 'client_registration_date', true),
                'client_status' => get_post_meta($post['id'], 'client_status', true),
                'translate_date' => get_post_meta($post['id'], 'translate_date', true),
                'delivery_date' => get_post_meta($post['id'], 'delivery_date', true),
                'client_description' => get_post_meta($post['id'], 'client_description', true),
                'created_at' => get_post_meta($post['id'], 'created_at', true),
                'updated_at' => get_post_meta($post['id'], 'updated_at', true),
            );
        },
        'update_callback' => function($value, $post) {
            if (isset($value['client_name'])) update_post_meta($post->ID, 'client_name', $value['client_name']);
            if (isset($value['client_first_name'])) update_post_meta($post->ID, 'client_first_name', $value['client_first_name']);
            if (isset($value['client_last_name'])) update_post_meta($post->ID, 'client_last_name', $value['client_last_name']);
            if (isset($value['client_company'])) update_post_meta($post->ID, 'client_company', $value['client_company']);
            if (isset($value['client_phone'])) update_post_meta($post->ID, 'client_phone', $value['client_phone']);
            if (isset($value['client_email'])) update_post_meta($post->ID, 'client_email', $value['client_email']);
            if (isset($value['client_address'])) update_post_meta($post->ID, 'client_address', $value['client_address']);
            if (isset($value['client_national_id'])) update_post_meta($post->ID, 'client_national_id', $value['client_national_id']);
            if (isset($value['client_code'])) update_post_meta($post->ID, 'client_code', $value['client_code']);
            if (isset($value['service_type'])) update_post_meta($post->ID, 'service_type', $value['service_type']);
            if (isset($value['client_type'])) update_post_meta($post->ID, 'client_type', $value['client_type']);
            if (isset($value['client_registration_date'])) update_post_meta($post->ID, 'client_registration_date', $value['client_registration_date']);
            if (isset($value['client_status'])) update_post_meta($post->ID, 'client_status', $value['client_status']);
            if (isset($value['translate_date'])) update_post_meta($post->ID, 'translate_date', $value['translate_date']);
            if (isset($value['delivery_date'])) update_post_meta($post->ID, 'delivery_date', $value['delivery_date']);
            if (isset($value['client_description'])) {
                update_post_meta($post->ID, 'client_description', $value['client_description']);
            }
            if (isset($value['created_at'])) update_post_meta($post->ID, 'created_at', $value['created_at']);
            if (isset($value['updated_at'])) update_post_meta($post->ID, 'updated_at', $value['updated_at']);
            return true;
        },
        'schema' => array(
            'description' => 'Client meta data',
            'type' => 'object',
            'context' => array('view', 'edit')
        )
    ));
});

// Allow meta field updates in REST API for creation
add_action('rest_insert_clients', function($post, $request, $creating) {
    if (isset($request['meta'])) {
        $meta = $request['meta'];
        foreach ($meta as $key => $value) {
            update_post_meta($post->ID, $key, $value);
        }
    }
}, 10, 3);

// Allow meta field updates in REST API for updates
add_action('rest_post_clients', function($post, $request, $creating) {
    // Handle meta field updates
    if (!$creating && isset($request['meta'])) {
        $meta = $request['meta'];
        foreach ($meta as $key => $value) {
            // Delete existing meta first to ensure clean update
            delete_post_meta($post->ID, $key);
            add_post_meta($post->ID, $key, $value, true);
            
            // Also try using wp_update_post_meta
            update_post_meta($post->ID, $key, $value);
        }
    }
}, 10, 3);

// Additional hook for update operations
add_action('rest_after_insert_clients', function($post, $request, $creating) {
    if (!$creating && isset($request['meta'])) {
        $meta = $request['meta'];
        foreach ($meta as $key => $value) {
            update_post_meta($post->ID, $key, $value);
        }
        
        // Refresh cache
        wp_cache_delete($post->ID, 'post_meta');
        clean_post_cache($post->ID);
    }
}, 10, 3);


// Direct meta field update hook for PUT requests
add_action('rest_insert_client', function($post, $request, $creating) {
    if (!$creating && isset($request['meta'])) {
        $meta = $request['meta'];
        foreach ($meta as $key => $value) {
            delete_post_meta($post->ID, $key);
            add_post_meta($post->ID, $key, $value, true);
        }
        
        // Flush cache
        wp_cache_delete($post->ID, 'post_meta');
        clean_post_cache($post->ID);
    }
}, 10, 3);

// 🚀 NEW: Force meta update using rest_prepare_data_hooks
add_filter('rest_prepare_clients', function($response, $post, $request) {
    if ($request->get_method() === 'PUT' && isset($request['meta'])) {
        $meta = $request['meta'];
        foreach ($meta as $key => $value) {
            update_post_meta($post->ID, $key, $value);
        }
    }
    return $response;
}, 10, 3);

// Enable DELETE operations for clients
add_filter('rest_prepare_clients', function($response, $post, $request) {
    // Allow DELETE operations
    if ($request->get_method() === 'DELETE') {
        return $response;
    }
    return $response;
}, 10, 3);

// Add DELETE permission for clients
add_filter('rest_pre_insert_clients', function($prepared_post, $request) {
    return $prepared_post;
}, 10, 2);

// Handle DELETE requests for clients
add_action('rest_delete_clients', function($post, $request) {
}, 10, 2);

// Override REST API controller for clients to enable PUT/DELETE
add_filter('rest_prepare_clients', function($response, $post, $request) {
    // Ensure PUT/DELETE operations are allowed
    if ($request->get_method() === 'PUT' || $request->get_method() === 'DELETE') {
        $response->header('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    return $response;
}, 10, 3);

// Add permissions callback for clients (PUT/DELETE)
add_filter('rest_clients_item_permissions_check', function($permission, $request) {
    if ($request->get_method() === 'DELETE' || $request->get_method() === 'PUT') {
        // Check if user is authenticated
        $user_id = get_current_user_id();
        if ($user_id > 0) {
            return true; // Allow PUT/DELETE for authenticated users
        }
        return false; // Deny DELETE for non-authenticated users
    }
    return $permission;
}, 10, 2);

// Register custom update client endpoint  
add_action('rest_api_init', function() {
    
    register_rest_route('custom/v1', '/clients/(?P<id>\d+)/update', array(
        'methods' => 'PUT',
        'callback' => 'update_client_field',
        'permission_callback' => function($request) {
            // Check for Authorization header
            $auth_header = $request->get_header('Authorization');
            
            if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
                return true;
            }
            
            // Check if user is logged in via WordPress
            $user_id = get_current_user_id();
            return $user_id > 0;
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer'
            ),
            'field' => array(
                'required' => true,
                'type' => 'string'
            ),
            'value' => array(
                'required' => true,
                'type' => 'string'
            )
        )
    ));
    
    // Simple test endpoint
    register_rest_route('custom/v1', '/test', array(
        'methods' => 'GET',
        'callback' => function() {
            return array('message' => 'API is working!', 'timestamp' => current_time('c'));
        },
        'permission_callback' => '__return_true'
    ));
    
    // Test update endpoint without validation
    register_rest_route('custom/v1', '/test-update', array(
        'methods' => 'PUT',
        'callback' => function($request) {
            $field = $request['field'] ?? 'test_field';
            $value = $request['value'] ?? 'test_value';
            
            return array(
                'success' => true,
                'message' => 'Test update successful',
                'received_field' => $field,
                'received_value' => $value,
                'timestamp' => current_time('c')
            );
        },
        'permission_callback' => '__return_true'
    ));
    
});

function update_client_field($request) {
    // Simple working version
    $client_id = $request['id'];
    $field = $request['field'];
    $value = $request['value'];
    
    // Just update the meta field directly
    $success = add_post_meta($client_id, $field, $value, true);
    
    if ($success === false) {
        // Try update_post_meta if add fails
        $success = update_post_meta($client_id, $field, $value);
    }
    
    return array(
        'success' => true,
        'message' => 'Field updated successfully',
        'client_id' => $client_id,
        'field' => $field,
        'value' => $value
    );
}

/* --------------------------
 * 🔹 Custom Post Type for Orders
 * -------------------------- */

// Register Orders custom post type
add_action('init', function() {
    register_post_type('orders', array(
        'labels' => array(
            'name' => 'Orders',
            'singular_name' => 'Order',
            'add_new' => 'Add New Order',
            'add_new_item' => 'Add New Order',
            'edit_item' => 'Edit Order',
            'new_item' => 'New Order',
            'view_item' => 'View Order',
            'search_items' => 'Search Orders',
            'not_found' => 'No orders found',
            'not_found_in_trash' => 'No orders found in trash'
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'custom-fields'),
        'show_in_rest' => true, // Enable REST API
        'rest_base' => 'orders', // Endpoint name
        'capability_type' => 'post',
        'capabilities' => array(
            'create_posts' => 'edit_posts',
            'delete_posts' => 'edit_posts',
            'delete_post' => 'edit_posts',
        ),
        'map_meta_cap' => true,
    ));
});

// Add meta fields to REST API for Orders
add_action('rest_api_init', function() {
    register_rest_field('orders', 'meta', array(
        'get_callback' => function($post) {
            return array(
                'client_code' => get_post_meta($post['id'], 'client_code', true),
                'client_id' => get_post_meta($post['id'], 'client_id', true),
                'client_type' => get_post_meta($post['id'], 'client_type', true),
                'client_name' => get_post_meta($post['id'], 'client_name', true),
                'client_phone' => get_post_meta($post['id'], 'client_phone', true),
                'client_email' => get_post_meta($post['id'], 'client_email', true),
                'client_address' => get_post_meta($post['id'], 'client_address', true),
                'translation_type' => get_post_meta($post['id'], 'translation_type', true),
                'document_type' => get_post_meta($post['id'], 'document_type', true),
                'language_from' => get_post_meta($post['id'], 'language_from', true),
                'language_to' => get_post_meta($post['id'], 'language_to', true),
                'number_of_pages' => get_post_meta($post['id'], 'number_of_pages', true),
                'urgency' => get_post_meta($post['id'], 'urgency', true),
                'special_instructions' => get_post_meta($post['id'], 'special_instructions', true),
                'service_type' => get_post_meta($post['id'], 'service_type', true),
                'order_status' => get_post_meta($post['id'], 'order_status', true),
                'created_at' => get_post_meta($post['id'], 'created_at', true),
                'updated_at' => get_post_meta($post['id'], 'updated_at', true),
                'total_price' => get_post_meta($post['id'], 'total_price', true),
                'order_history' => get_post_meta($post['id'], 'order_history', true)
            );
        },
        'update_callback' => function($value, $post) {
            // Update all order fields
            $fields = ['client_code', 'client_id', 'client_type', 'client_name', 
                      'client_phone', 'client_email', 'client_address', 'translation_type', 
                      'document_type', 'language_from', 'language_to', 'number_of_pages', 
                      'urgency', 'special_instructions', 'service_type', 'order_status', 'created_at', 
                      'updated_at', 'total_price', 'order_history'];
            
            foreach ($fields as $field) {
                if (isset($value[$field])) {
                    update_post_meta($post->ID, $field, $value[$field]);
                }
            }
            return true;
        },
        'schema' => array(
            'description' => 'Order meta data',
            'type' => 'object',
            'context' => array('view', 'edit')
        )
    ));
});

// Allow meta field updates in REST API
add_action('rest_insert_orders', function($post, $request, $creating) {
    if (isset($request['meta'])) {
        $meta = $request['meta'];
        foreach ($meta as $key => $value) {
            update_post_meta($post->ID, $key, $value);
        }
    }
}, 10, 3);

// Enable DELETE operations for orders
add_filter('rest_prepare_orders', function($response, $post, $request) {
    // Allow DELETE operations
    if ($request->get_method() === 'DELETE') {
        return $response;
    }
    return $response;
}, 10, 3);

// Add DELETE permission for orders
add_filter('rest_pre_insert_orders', function($prepared_post, $request) {
    return $prepared_post;
}, 10, 2);

// Handle DELETE requests for orders
add_action('rest_delete_orders', function($post, $request) {
}, 10, 2);

// Override REST API controller for orders to enable DELETE
add_filter('rest_prepare_orders', function($response, $post, $request) {
    // Ensure DELETE operations are allowed
    if ($request->get_method() === 'DELETE') {
        $response->header('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    return $response;
}, 10, 3);

// Add DELETE permission callback for orders
add_filter('rest_orders_item_permissions_check', function($permission, $request) {
    if ($request->get_method() === 'DELETE') {
        // Check if user is authenticated
        $user_id = get_current_user_id();
        if ($user_id > 0) {
            return true; // Allow DELETE for authenticated users
        }
        return false; // Deny DELETE for non-authenticated users
    }
    return $permission;
}, 10, 2);

/* --------------------------
 * 🔹 Enable DELETE Operations for Custom Post Types
 * -------------------------- */

// Force enable DELETE operations for custom post types
add_action('rest_api_init', function() {
    // Override the REST API controller to enable DELETE
    add_filter('rest_prepare_clients', function($response, $post, $request) {
        if ($request->get_method() === 'DELETE') {
            $result = wp_delete_post($post->ID, false);
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Client deleted successfully',
                    'client_id' => $post->ID
                ), 200);
            } else {
                return new WP_Error('delete_failed', 'Failed to delete client', array('status' => 500));
            }
        }
        return $response;
    }, 10, 3);
    
    add_filter('rest_prepare_orders', function($response, $post, $request) {
        if ($request->get_method() === 'DELETE') {
            $result = wp_delete_post($post->ID, false);
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Order deleted successfully',
                    'order_id' => $post->ID
                ), 200);
            } else {
                return new WP_Error('delete_failed', 'Failed to delete order', array('status' => 500));
            }
        }
        return $response;
    }, 10, 3);
});

// Enable DELETE method in REST API
add_filter('rest_request_before_callbacks', function($response, $handler, $request) {
    if ($request->get_method() === 'DELETE') {
        $route = $request->get_route();
        if (strpos($route, '/clients/') !== false || strpos($route, '/orders/') !== false) {
            // Allow DELETE requests
            return $response;
        }
    }
    return $response;
}, 10, 3);

// Override the REST API controller to handle DELETE requests
add_filter('rest_pre_dispatch', function($result, $server, $request) {
    if ($request->get_method() === 'DELETE') {
        $route = $request->get_route();
        
        // Handle DELETE for clients
        if (preg_match('/^\/wp\/v2\/clients\/(\d+)$/', $route, $matches)) {
            $client_id = $matches[1];
            $client = get_post($client_id);
            
            if (!$client || $client->post_type !== 'clients') {
                return new WP_Error('rest_post_invalid_id', 'Invalid post ID.', array('status' => 404));
            }
            
            // Check if user has permission to delete
            $user_id = get_current_user_id();
            if ($user_id <= 0) {
                return new WP_Error('rest_forbidden', 'Authentication required.', array('status' => 401));
            }
            
            $result = wp_delete_post($client_id, false);
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Client deleted successfully',
                    'client_id' => $client_id
                ), 200);
            } else {
                return new WP_Error('delete_failed', 'Failed to delete client', array('status' => 500));
            }
        }
        
        // Handle DELETE for orders
        if (preg_match('/^\/wp\/v2\/orders\/(\d+)$/', $route, $matches)) {
            $order_id = $matches[1];
            $order = get_post($order_id);
            
            if (!$order || $order->post_type !== 'orders') {
                return new WP_Error('rest_post_invalid_id', 'Invalid post ID.', array('status' => 404));
            }
            
            // Check if user has permission to delete
            $user_id = get_current_user_id();
            if ($user_id <= 0) {
                return new WP_Error('rest_forbidden', 'Authentication required.', array('status' => 401));
            }
            
            $result = wp_delete_post($order_id, false);
            if ($result) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => 'Order deleted successfully',
                    'order_id' => $order_id
                ), 200);
            } else {
                return new WP_Error('delete_failed', 'Failed to delete order', array('status' => 500));
            }
        }
    }
    
    return $result;
}, 10, 3);

/* --------------------------
 * 🔹 Custom DELETE Endpoints (Fallback)
 * -------------------------- */

// Custom DELETE endpoint for clients (fallback)
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/clients/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_client_custom',
        'permission_callback' => function() {
            $user_id = get_current_user_id();
            return $user_id > 0; // Only allow authenticated users
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'description' => 'Client ID to delete'
            )
        )
    ));
});

function delete_client_custom($request) {
    $client_id = $request['id'];
    
    // Check if client exists
    $client = get_post($client_id);
    if (!$client || $client->post_type !== 'clients') {
        return new WP_Error('client_not_found', 'Client not found', array('status' => 404));
    }
    
    // Delete the client (move to trash)
    $result = wp_delete_post($client_id, false);
    
    if ($result) {
        return array(
            'success' => true,
            'message' => 'Client deleted successfully',
            'client_id' => $client_id
        );
    } else {
        return new WP_Error('delete_failed', 'Failed to delete client', array('status' => 500));
    }
}

// Custom DELETE endpoint for orders (fallback)
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/orders/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_order_custom',
        'permission_callback' => function() {
            $user_id = get_current_user_id();
            return $user_id > 0; // Only allow authenticated users
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'description' => 'Order ID to delete'
            )
        )
    ));
});

function delete_order_custom($request) {
    $order_id = $request['id'];
    
    // Check if order exists
    $order = get_post($order_id);
    if (!$order || $order->post_type !== 'orders') {
        return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
    }
    
    // Delete the order (move to trash)
    $result = wp_delete_post($order_id, false);
    
    if ($result) {
        return array(
            'success' => true,
            'message' => 'Order deleted successfully',
            'order_id' => $order_id
        );
    } else {
        return new WP_Error('delete_failed', 'Failed to delete order', array('status' => 500));
    }
}

/* --------------------------
 * 🔹 Custom Endpoints for Order Management
 * -------------------------- */

// Custom endpoint for Order Status Update
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/orders/(?P<id>\d+)/status', array(
        'methods' => 'POST',
        'callback' => 'update_order_status',
        'permission_callback' => function() {
            return true; // Allow public access for now
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'description' => 'Order ID'
            ),
            'status' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'New order status'
            ),
            'changed_by' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'User who changed the status'
            ),
            'notes' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Notes about the status change'
            )
        )
    ));
});

function update_order_status($request) {
    $order_id = $request['id'];
    $new_status = $request->get_param('status');
    $changed_by = $request->get_param('changed_by');
    $notes = $request->get_param('notes') ?: '';
    
    // Check if order exists
    $order = get_post($order_id);
    if (!$order || $order->post_type !== 'orders') {
        return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
    }
    
    // Get current history
    $current_history = get_post_meta($order_id, 'order_history', true);
    $history = $current_history ? json_decode($current_history, true) : array();
    
    // Add new history entry
    $history[] = array(
        'id' => uniqid(),
        'orderId' => $order_id,
        'status' => $new_status,
        'changedBy' => $changed_by,
        'changedAt' => current_time('c'),
        'notes' => $notes
    );
    
    // Update order status and history
    update_post_meta($order_id, 'order_status', $new_status);
    update_post_meta($order_id, 'updated_at', current_time('c'));
    update_post_meta($order_id, 'order_history', json_encode($history));
    
    return array(
        'success' => true, 
        'message' => 'Order status updated successfully',
        'order_id' => $order_id,
        'new_status' => $new_status,
        'updated_at' => current_time('c')
    );
}

// Custom endpoint for Order List with Filters
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/orders', array(
        'methods' => 'GET',
        'callback' => 'get_orders_with_filters',
        'permission_callback' => function() {
            return true; // Allow public access for now
        },
        'args' => array(
            'status' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter by order status'
            ),
            'client_id' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter by client ID'
            ),
            'date_from' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter orders from this date (YYYY-MM-DD)'
            ),
            'date_to' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter orders to this date (YYYY-MM-DD)'
            ),
            'per_page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 10,
                'description' => 'Number of orders per page'
            ),
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 1,
                'description' => 'Page number'
            )
        )
    ));
});

function get_orders_with_filters($request) {
    $status = $request->get_param('status');
    $client_id = $request->get_param('client_id');
    $date_from = $request->get_param('date_from');
    $date_to = $request->get_param('date_to');
    $per_page = $request->get_param('per_page') ?: 10;
    $page = $request->get_param('page') ?: 1;
    
    $args = array(
        'post_type' => 'orders',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array(),
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    if ($status) {
        $args['meta_query'][] = array(
            'key' => 'order_status',
            'value' => $status,
            'compare' => '='
        );
    }
    
    if ($client_id) {
        $args['meta_query'][] = array(
            'key' => 'client_id',
            'value' => $client_id,
            'compare' => '='
        );
    }
    
    if ($date_from || $date_to) {
        $date_query = array();
        if ($date_from) {
            $date_query['after'] = $date_from;
        }
        if ($date_to) {
            $date_query['before'] = $date_to;
        }
        $args['date_query'] = $date_query;
    }
    
    $orders_query = new WP_Query($args);
    $orders = $orders_query->posts;
    $result = array();
    
    foreach ($orders as $order) {
        $result[] = array(
            'id' => $order->ID,
            'title' => $order->post_title,
            'client_name' => get_post_meta($order->ID, 'client_name', true),
            'client_code' => get_post_meta($order->ID, 'client_code', true),
            'status' => get_post_meta($order->ID, 'order_status', true),
            'translation_type' => get_post_meta($order->ID, 'translation_type', true),
            'document_type' => get_post_meta($order->ID, 'document_type', true),
            'urgency' => get_post_meta($order->ID, 'urgency', true),
            'total_price' => get_post_meta($order->ID, 'total_price', true),
            'created_at' => get_post_meta($order->ID, 'created_at', true),
            'updated_at' => get_post_meta($order->ID, 'updated_at', true)
        );
    }
    
    return array(
        'orders' => $result,
        'total' => $orders_query->found_posts,
        'pages' => $orders_query->max_num_pages,
        'current_page' => $page,
        'per_page' => $per_page
    );
}

/* --------------------------
 * 🔹 Test Endpoint for Debugging
 * -------------------------- */

// Test endpoint to verify backend is working
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/test', array(
        'methods' => 'POST',
        'callback' => 'test_endpoint',
        'permission_callback' => function() {
            return true; // Allow public access for testing
        }
    ));
});

function test_endpoint($request) {
    return array(
        'success' => true,
        'message' => 'Test endpoint working',
        'timestamp' => current_time('c'),
        'received_data' => $request->get_params()
    );
}

/* --------------------------
 * 🔹 Unified Order Management Endpoint
 * -------------------------- */

// Unified endpoint for creating orders with complete client data
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/unified-orders', array(
        'methods' => 'POST',
        'callback' => 'create_unified_order',
        'permission_callback' => function() {
            // Check if user is authenticated via JWT token
            $user_id = get_current_user_id();
            if ($user_id > 0) {
                return true;
            }
            
            // Check for JWT token in Authorization header
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $auth_header = $headers['Authorization'];
                if (strpos($auth_header, 'Bearer ') === 0) {
                    $token = substr($auth_header, 7);
                    // For now, allow any Bearer token (you should validate the token properly)
                    return !empty($token);
                }
            }
            
            return false;
        },
        'args' => array(
            // Snake case parameters (for form data)
            'client_code' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client code'
            ),
            'client_name' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client name'
            ),
            'client_phone' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client phone'
            ),
            'client_email' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client email'
            ),
            'client_address' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client address'
            ),
            'client_type' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'person',
                'description' => 'Client type (person/company)'
            ),
            'translation_type' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Translation type'
            ),
            'document_type' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Document type'
            ),
            'language_from' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Source language'
            ),
            'language_to' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Target language'
            ),
            'number_of_pages' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Number of pages'
            ),
            'urgency' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'normal',
                'description' => 'Order urgency'
            ),
            'special_instructions' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Special instructions'
            ),
            'service_type' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Service type'
            ),
            'status' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Order status'
            ),
            'total_price' => array(
                'required' => false,
                'type' => 'number',
                'default' => 0,
                'description' => 'Total price'
            ),
            // Camel case parameters (for JSON data)
            'clientCode' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client code (camelCase)'
            ),
            'clientName' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client name (camelCase)'
            ),
            'clientPhone' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client phone (camelCase)'
            ),
            'clientEmail' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client email (camelCase)'
            ),
            'clientAddress' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Client address (camelCase)'
            ),
            'clientType' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'person',
                'description' => 'Client type (camelCase)'
            ),
            'translationType' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Translation type (camelCase)'
            ),
            'serviceType' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Service type (camelCase)'
            ),
            'status' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Order status (camelCase)'
            ),
            'documentType' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Document type (camelCase)'
            ),
            'languageFrom' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Source language (camelCase)'
            ),
            'languageTo' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Target language (camelCase)'
            ),
            'numberOfPages' => array(
                'required' => false,
                'type' => 'integer',
                'description' => 'Number of pages (camelCase)'
            ),
            'specialInstructions' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Special instructions (camelCase)'
            ),
            'totalPrice' => array(
                'required' => false,
                'type' => 'number',
                'default' => 0,
                'description' => 'Total price (camelCase)'
            )
        )
    ));
});

function create_unified_order($request) {
    // Get JSON data from request body
    $json_params = $request->get_json_params();
    
    // Extract parameters from camelCase (from REST API validation) or JSON data or snake_case
    $client_code = $request->get_param('clientCode') ?: 
                   (isset($json_params['clientCode']) ? $json_params['clientCode'] : 
                    (isset($json_params['client_code']) ? $json_params['client_code'] : $request->get_param('client_code')));
    $client_name = $request->get_param('clientName') ?: 
                   (isset($json_params['clientName']) ? $json_params['clientName'] : 
                    (isset($json_params['client_name']) ? $json_params['client_name'] : $request->get_param('client_name')));
    $client_first_name = $request->get_param('clientFirstName') ?: 
                        (isset($json_params['clientFirstName']) ? $json_params['clientFirstName'] : 
                         (isset($json_params['client_first_name']) ? $json_params['client_first_name'] : ($request->get_param('client_first_name') ?: '')));
    $client_last_name = $request->get_param('clientLastName') ?: 
                       (isset($json_params['clientLastName']) ? $json_params['clientLastName'] : 
                        (isset($json_params['client_last_name']) ? $json_params['client_last_name'] : ($request->get_param('client_last_name') ?: '')));
    $client_company = $request->get_param('clientCompany') ?: 
                     (isset($json_params['clientCompany']) ? $json_params['clientCompany'] : 
                      (isset($json_params['client_company']) ? $json_params['client_company'] : ($request->get_param('client_company') ?: '')));
    $client_phone = $request->get_param('clientPhone') ?: 
                    (isset($json_params['clientPhone']) ? $json_params['clientPhone'] : 
                     (isset($json_params['client_phone']) ? $json_params['client_phone'] : ($request->get_param('client_phone') ?: '')));
    $client_email = $request->get_param('clientEmail') ?: 
                    (isset($json_params['clientEmail']) ? $json_params['clientEmail'] : 
                     (isset($json_params['client_email']) ? $json_params['client_email'] : ($request->get_param('client_email') ?: '')));
    $client_address = $request->get_param('clientAddress') ?: 
                      (isset($json_params['clientAddress']) ? $json_params['clientAddress'] : 
                       (isset($json_params['client_address']) ? $json_params['client_address'] : ($request->get_param('client_address') ?: '')));
    $client_national_id = $request->get_param('clientNationalId') ?: 
                         (isset($json_params['clientNationalId']) ? $json_params['clientNationalId'] : 
                          (isset($json_params['client_national_id']) ? $json_params['client_national_id'] : ($request->get_param('client_national_id') ?: '')));
    $client_type = $request->get_param('clientType') ?: 
                   (isset($json_params['clientType']) ? $json_params['clientType'] : 
                    (isset($json_params['client_type']) ? $json_params['client_type'] : ($request->get_param('client_type') ?: 'person')));
    $translation_type = $request->get_param('translationType') ?: 
                        (isset($json_params['translationType']) ? $json_params['translationType'] : 
                         (isset($json_params['translation_type']) ? $json_params['translation_type'] : $request->get_param('translation_type')));
    $document_type = $request->get_param('documentType') ?: 
                     (isset($json_params['documentType']) ? $json_params['documentType'] : 
                      (isset($json_params['document_type']) ? $json_params['document_type'] : $request->get_param('document_type')));
    $language_from = $request->get_param('languageFrom') ?: 
                     (isset($json_params['languageFrom']) ? $json_params['languageFrom'] : 
                      (isset($json_params['language_from']) ? $json_params['language_from'] : $request->get_param('language_from')));
    $language_to = $request->get_param('languageTo') ?: 
                   (isset($json_params['languageTo']) ? $json_params['languageTo'] : 
                    (isset($json_params['language_to']) ? $json_params['language_to'] : $request->get_param('language_to')));
    $number_of_pages = $request->get_param('numberOfPages') ?: 
                       (isset($json_params['numberOfPages']) ? $json_params['numberOfPages'] : 
                        (isset($json_params['number_of_pages']) ? $json_params['number_of_pages'] : $request->get_param('number_of_pages')));
    $urgency = $request->get_param('urgency') ?: 
               (isset($json_params['urgency']) ? $json_params['urgency'] : 
                (isset($json_params['urgency']) ? $json_params['urgency'] : ($request->get_param('urgency') ?: 'normal')));
    $special_instructions = $request->get_param('specialInstructions') ?: 
                            (isset($json_params['specialInstructions']) ? $json_params['specialInstructions'] : 
                             (isset($json_params['special_instructions']) ? $json_params['special_instructions'] : ($request->get_param('special_instructions') ?: '')));
    $service_type = $request->get_param('serviceType') ?: 
                    (isset($json_params['serviceType']) ? $json_params['serviceType'] : 
                     (isset($json_params['service_type']) ? $json_params['service_type'] : ($request->get_param('service_type') ?: 'ترجمه')));
    $status = $request->get_param('status') ?: 
              (isset($json_params['status']) ? $json_params['status'] : 
               (isset($json_params['status']) ? $json_params['status'] : ($request->get_param('status') ?: 'acceptance')));
    $total_price = $request->get_param('totalPrice') ?: 
                   (isset($json_params['totalPrice']) ? $json_params['totalPrice'] : 
                    (isset($json_params['total_price']) ? $json_params['total_price'] : ($request->get_param('total_price') ?: 0)));
    
    // Validate required fields
    if (empty($client_code)) {
        return new WP_Error('missing_client_code', 'Client code is required', array('status' => 400));
    }
    if (empty($client_name)) {
        return new WP_Error('missing_client_name', 'Client name is required', array('status' => 400));
    }
    if (empty($translation_type)) {
        return new WP_Error('missing_translation_type', 'Translation type is required', array('status' => 400));
    }
    if (empty($document_type)) {
        return new WP_Error('missing_document_type', 'Document type is required', array('status' => 400));
    }
    if (empty($language_from)) {
        return new WP_Error('missing_language_from', 'Source language is required', array('status' => 400));
    }
    if (empty($language_to)) {
        return new WP_Error('missing_language_to', 'Target language is required', array('status' => 400));
    }
    if (empty($number_of_pages) || $number_of_pages <= 0) {
        return new WP_Error('invalid_number_of_pages', 'Number of pages must be greater than 0', array('status' => 400));
    }
    
    // Check if client already exists
    $existing_client = get_posts(array(
        'post_type' => 'clients',
        'meta_query' => array(
            array(
                'key' => 'client_code',
                'value' => $client_code,
                'compare' => '='
            )
        ),
        'posts_per_page' => 1
    ));
    
    $client_id = null;
    
    if (!empty($existing_client)) {
        // Update existing client
        $client_id = $existing_client[0]->ID;
        update_post_meta($client_id, 'client_name', $client_name);
        update_post_meta($client_id, 'client_first_name', $client_first_name);
        update_post_meta($client_id, 'client_last_name', $client_last_name);
        update_post_meta($client_id, 'client_company', $client_company);
        update_post_meta($client_id, 'client_phone', $client_phone);
        update_post_meta($client_id, 'client_email', $client_email);
        update_post_meta($client_id, 'client_address', $client_address);
        update_post_meta($client_id, 'client_national_id', $client_national_id);
        update_post_meta($client_id, 'client_type', $client_type);
        update_post_meta($client_id, 'updated_at', current_time('c'));
        
        wp_update_post(array(
            'ID' => $client_id,
            'post_title' => $client_name,
            'post_content' => "کد مشتری: {$client_code}\nتلفن: {$client_phone}\nایمیل: {$client_email}\nآدرس: {$client_address}"
        ));
    } else {
        // Create new client
        $client_post = wp_insert_post(array(
            'post_title' => $client_name,
            'post_content' => "کد مشتری: {$client_code}\nتلفن: {$client_phone}\nایمیل: {$client_email}\nآدرس: {$client_address}",
            'post_status' => 'publish',
            'post_type' => 'clients'
        ));
        
        if ($client_post && !is_wp_error($client_post)) {
            $client_id = $client_post;
            
            // Add client meta data
            update_post_meta($client_id, 'client_code', $client_code);
            update_post_meta($client_id, 'client_name', $client_name);
            update_post_meta($client_id, 'client_first_name', $client_first_name);
            update_post_meta($client_id, 'client_last_name', $client_last_name);
            update_post_meta($client_id, 'client_company', $client_company);
            update_post_meta($client_id, 'client_phone', $client_phone);
            update_post_meta($client_id, 'client_email', $client_email);
            update_post_meta($client_id, 'client_address', $client_address);
            update_post_meta($client_id, 'client_national_id', $client_national_id);
            update_post_meta($client_id, 'client_type', $client_type);
            update_post_meta($client_id, 'client_status', 'acceptance');
            update_post_meta($client_id, 'created_at', current_time('c'));
            update_post_meta($client_id, 'updated_at', current_time('c'));
        }
    }
    
    if (!$client_id) {
        return new WP_Error('client_creation_failed', 'Failed to create or update client', array('status' => 500));
    }
    
    // Create order
    $order_post = wp_insert_post(array(
        'post_title' => "سفارش {$client_code}",
        'post_content' => $special_instructions,
        'post_status' => 'publish',
        'post_type' => 'orders'
    ));
    
    if ($order_post && !is_wp_error($order_post)) {
        // Add order meta data
        update_post_meta($order_post, 'client_code', $client_code);
        update_post_meta($order_post, 'client_id', $client_id);
        update_post_meta($order_post, 'client_type', $client_type);
        update_post_meta($order_post, 'client_name', $client_name);
        update_post_meta($order_post, 'client_first_name', $client_first_name);
        update_post_meta($order_post, 'client_last_name', $client_last_name);
        update_post_meta($order_post, 'client_company', $client_company);
        update_post_meta($order_post, 'client_phone', $client_phone);
        update_post_meta($order_post, 'client_email', $client_email);
        update_post_meta($order_post, 'client_address', $client_address);
        update_post_meta($order_post, 'client_national_id', $client_national_id);
        update_post_meta($order_post, 'translation_type', $translation_type);
        update_post_meta($order_post, 'document_type', $document_type);
        update_post_meta($order_post, 'language_from', $language_from);
        update_post_meta($order_post, 'language_to', $language_to);
        update_post_meta($order_post, 'number_of_pages', $number_of_pages);
        update_post_meta($order_post, 'urgency', $urgency);
        update_post_meta($order_post, 'special_instructions', $special_instructions);
        update_post_meta($order_post, 'service_type', $service_type);
        update_post_meta($order_post, 'order_status', $status);
        update_post_meta($order_post, 'total_price', $total_price);
        update_post_meta($order_post, 'created_at', current_time('c'));
        update_post_meta($order_post, 'updated_at', current_time('c'));
        
        // Create initial history
        $history = array(array(
            'id' => uniqid(),
            'orderId' => $order_post,
            'status' => 'acceptance',
            'changedBy' => 'system',
            'changedAt' => current_time('c'),
            'notes' => 'سفارش ایجاد شد'
        ));
        update_post_meta($order_post, 'order_history', json_encode($history));
        
        return array(
            'success' => true,
            'message' => 'Order and client created successfully',
            'order_id' => $order_post,
            'client_id' => $client_id,
            'client_code' => $client_code
        );
    } else {
        return new WP_Error('order_creation_failed', 'Failed to create order', array('status' => 500));
    }
}

// Unified endpoint for getting single order with complete client data
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/unified-orders/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'get_unified_order',
        'permission_callback' => function() {
            // Check if user is authenticated via JWT token
            $user_id = get_current_user_id();
            if ($user_id > 0) {
                return true;
            }
            
            // Check for JWT token in Authorization header
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $token = str_replace('Bearer ', '', $headers['Authorization']);
                $user_id = wp_validate_auth_cookie($token);
                return $user_id > 0;
            }
            
            return true; // Allow public access for now
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'description' => 'Order ID to get'
            )
        )
    ));
});

// Unified endpoint for deleting orders with complete client data
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/unified-orders/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_unified_order',
        'permission_callback' => function() {
            // Check if user is authenticated via JWT token
            $user_id = get_current_user_id();
            if ($user_id > 0) {
                return true;
            }
            
            // Check for JWT token in Authorization header
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $token = str_replace('Bearer ', '', $headers['Authorization']);
                $user_id = wp_validate_auth_cookie($token);
                return $user_id > 0;
            }
            
            return true; // Allow public access for now
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'description' => 'Order ID to delete'
            )
        )
    ));
});

// Unified endpoint for updating orders with complete client data
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/unified-orders/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'update_unified_order',
        'permission_callback' => function() {
            // Check if user is authenticated via JWT token
            $user_id = get_current_user_id();
            if ($user_id > 0) {
                return true;
            }
            
            // Check for JWT token in Authorization header
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $token = str_replace('Bearer ', '', $headers['Authorization']);
                $user_id = wp_validate_auth_cookie($token);
                return $user_id > 0;
            }
            
            return true; // Allow public access for now
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'description' => 'Order ID to update'
            )
        )
    ));
});

// Unified endpoint for getting orders with complete client data
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/unified-orders', array(
        'methods' => 'GET',
        'callback' => 'get_unified_orders',
        'permission_callback' => function() {
            // Check if user is authenticated via JWT token
            $user_id = get_current_user_id();
            if ($user_id > 0) {
                return true;
            }
            
            // Check for JWT token in Authorization header
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $auth_header = $headers['Authorization'];
                if (strpos($auth_header, 'Bearer ') === 0) {
                    $token = substr($auth_header, 7);
                    // For now, allow any Bearer token (you should validate the token properly)
                    return !empty($token);
                }
            }
            
            return false;
        },
        'args' => array(
            'status' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter by order status'
            ),
            'client_id' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter by client ID'
            ),
            'per_page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 50,
                'description' => 'Number of orders per page'
            ),
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 1,
                'description' => 'Page number'
            )
        )
    ));
});

function delete_unified_order($request) {
    $order_id = $request['id'];
    $delete_client = $request->get_param('delete_client') === 'true';
    
    // Get order to find client ID
    $client_id = get_post_meta($order_id, 'client_id', true);
    
    // Delete the order
    $order_deleted = wp_delete_post($order_id, true);
    
    if (!$order_deleted) {
        return new WP_Error('order_deletion_failed', 'Failed to delete order', array('status' => 500));
    }
    
    // If requested, also delete the client
    if ($delete_client && $client_id) {
        $client_deleted = wp_delete_post($client_id, true);
        if (!$client_deleted) {
            return new WP_Error('client_deletion_failed', 'Failed to delete client', array('status' => 500));
        }
    }
    
    return array(
        'success' => true,
        'message' => 'Order deleted successfully',
        'order_id' => $order_id,
        'client_deleted' => $delete_client && $client_id
    );
}

function get_unified_order($request) {
    $order_id = $request['id'];
    
    // Get order post
    $order = get_post($order_id);
    if (!$order || $order->post_type !== 'orders') {
        return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
    }
    
    // Get order meta fields
    $order_data = array(
        'id' => $order->ID,
        'client_code' => get_post_meta($order->ID, 'client_code', true),
        'client_id' => get_post_meta($order->ID, 'client_id', true),
        'client_type' => get_post_meta($order->ID, 'client_type', true),
        'client_name' => get_post_meta($order->ID, 'client_name', true),
        'client_first_name' => get_post_meta($order->ID, 'client_first_name', true),
        'client_last_name' => get_post_meta($order->ID, 'client_last_name', true),
        'client_company' => get_post_meta($order->ID, 'client_company', true),
        'client_phone' => get_post_meta($order->ID, 'client_phone', true),
        'client_email' => get_post_meta($order->ID, 'client_email', true),
        'client_address' => get_post_meta($order->ID, 'client_address', true),
        'client_national_id' => get_post_meta($order->ID, 'client_national_id', true),
        'translation_type' => get_post_meta($order->ID, 'translation_type', true),
        'document_type' => get_post_meta($order->ID, 'document_type', true),
        'language_from' => get_post_meta($order->ID, 'language_from', true),
        'language_to' => get_post_meta($order->ID, 'language_to', true),
        'number_of_pages' => get_post_meta($order->ID, 'number_of_pages', true),
        'urgency' => get_post_meta($order->ID, 'urgency', true),
        'special_instructions' => get_post_meta($order->ID, 'special_instructions', true),
        'service_type' => get_post_meta($order->ID, 'service_type', true),
        'order_status' => get_post_meta($order->ID, 'order_status', true),
        'total_price' => get_post_meta($order->ID, 'total_price', true),
        'created_at' => get_post_meta($order->ID, 'created_at', true),
        'updated_at' => get_post_meta($order->ID, 'updated_at', true),
        'order_history' => get_post_meta($order->ID, 'order_history', true)
    );
    
    // Get client data if client_id exists
    $client_id = get_post_meta($order->ID, 'client_id', true);
    if ($client_id) {
        $client = get_post($client_id);
        if ($client && $client->post_type === 'clients') {
            $order_data['client_data'] = array(
                'id' => $client->ID,
                'name' => get_post_meta($client->ID, 'client_name', true),
                'code' => get_post_meta($client->ID, 'client_code', true),
                'phone' => get_post_meta($client->ID, 'client_phone', true),
                'email' => get_post_meta($client->ID, 'client_email', true),
                'address' => get_post_meta($client->ID, 'client_address', true),
                'type' => get_post_meta($client->ID, 'client_type', true),
                'status' => get_post_meta($client->ID, 'client_status', true),
                'created_at' => get_post_meta($client->ID, 'created_at', true),
                'updated_at' => get_post_meta($client->ID, 'updated_at', true)
            );
        }
    }
    
    return $order_data;
}

function update_unified_order($request) {
    $order_id = $request['id'];
    $data = $request->get_json_params();
    
    // Update order post
    $order_update = wp_update_post(array(
        'ID' => $order_id,
        'post_title' => 'سفارش ' . ($data['client_code'] ?? ''),
        'post_content' => 'سفارش ترجمه',
        'post_status' => 'publish'
    ));
    
    if (!$order_update) {
        return new WP_Error('order_update_failed', 'Failed to update order', array('status' => 500));
    }
    
    // Update order meta fields - only update fields that are provided
    $allowed_fields = array(
        'client_code', 'client_id', 'client_type', 'client_name', 
        'client_first_name', 'client_last_name', 'client_company', 
        'client_phone', 'client_email', 'client_address', 
        'client_national_id', 'referrer_name', 'translation_type', 'document_type', 
        'language_from', 'language_to', 'number_of_pages', 
        'urgency', 'special_instructions', 'service_type', 
        'order_status', 'total_price'
    );
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            update_post_meta($order_id, $field, $data[$field]);
        }
    }
    
    // Always update the timestamp
    update_post_meta($order_id, 'updated_at', current_time('c'));
    
    // Update client if client_id is provided
    if (!empty($data['client_id'])) {
        $client_id = $data['client_id'];
        
        // Update client post
        wp_update_post(array(
            'ID' => $client_id,
            'post_title' => $data['client_name'] ?? '',
            'post_content' => 'مشتری',
            'post_status' => 'publish'
        ));
        
        // Update client meta fields - only update fields that are provided
        $allowed_client_fields = array(
            'client_name', 'client_first_name', 'client_last_name', 
            'client_company', 'client_phone', 'client_email', 
            'client_address', 'client_national_id', 'client_type'
        );
        
        foreach ($allowed_client_fields as $field) {
            if (isset($data[$field])) {
                update_post_meta($client_id, $field, $data[$field]);
            }
        }
        
        // Always update the client timestamp
        update_post_meta($client_id, 'updated_at', current_time('c'));
    }
    
    return array(
        'success' => true,
        'message' => 'Order updated successfully',
        'order_id' => $order_id
    );
}

function get_unified_orders($request) {
    $status = $request->get_param('status');
    $client_id = $request->get_param('client_id');
    $per_page = $request->get_param('per_page') ?: 50;
    $page = $request->get_param('page') ?: 1;
    
    $args = array(
        'post_type' => 'orders',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array(),
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    if ($status) {
        $args['meta_query'][] = array(
            'key' => 'order_status',
            'value' => $status,
            'compare' => '='
        );
    }
    
    if ($client_id) {
        $args['meta_query'][] = array(
            'key' => 'client_id',
            'value' => $client_id,
            'compare' => '='
        );
    }
    
    $orders_query = new WP_Query($args);
    $orders = $orders_query->posts;
    $result = array();
    
    
    foreach ($orders as $order) {
        $meta = get_post_meta($order->ID);
        
        // Get client data
        $client_id = get_post_meta($order->ID, 'client_id', true);
        $client_data = null;
        
        if ($client_id) {
            $client_post = get_post($client_id);
            if ($client_post) {
                $client_meta = get_post_meta($client_id);
                $client_data = array(
                    'id' => $client_id,
                    'name' => get_post_meta($client_id, 'client_name', true),
                    'first_name' => get_post_meta($client_id, 'client_first_name', true),
                    'last_name' => get_post_meta($client_id, 'client_last_name', true),
                    'company' => get_post_meta($client_id, 'client_company', true),
                    'code' => get_post_meta($client_id, 'client_code', true),
                    'phone' => get_post_meta($client_id, 'client_phone', true),
                    'email' => get_post_meta($client_id, 'client_email', true),
                    'address' => get_post_meta($client_id, 'client_address', true),
                    'national_id' => get_post_meta($client_id, 'client_national_id', true),
                    'type' => get_post_meta($client_id, 'client_type', true),
                    'status' => get_post_meta($client_id, 'client_status', true),
                    'created_at' => get_post_meta($client_id, 'created_at', true),
                    'updated_at' => get_post_meta($client_id, 'updated_at', true)
                );
            }
        }
        
        $result[] = array(
            'id' => $order->ID,
            'client_code' => get_post_meta($order->ID, 'client_code', true),
            'client_id' => $client_id,
            'client_type' => get_post_meta($order->ID, 'client_type', true),
            'client_name' => get_post_meta($order->ID, 'client_name', true),
            'client_first_name' => get_post_meta($order->ID, 'client_first_name', true),
            'client_last_name' => get_post_meta($order->ID, 'client_last_name', true),
            'client_company' => get_post_meta($order->ID, 'client_company', true),
            'client_phone' => get_post_meta($order->ID, 'client_phone', true),
            'client_email' => get_post_meta($order->ID, 'client_email', true),
            'client_address' => get_post_meta($order->ID, 'client_address', true),
            'client_national_id' => get_post_meta($order->ID, 'client_national_id', true),
            'referrer_name' => get_post_meta($order->ID, 'referrer_name', true),
            'translation_type' => get_post_meta($order->ID, 'translation_type', true),
            'document_type' => get_post_meta($order->ID, 'document_type', true),
            'language_from' => get_post_meta($order->ID, 'language_from', true),
            'language_to' => get_post_meta($order->ID, 'language_to', true),
            'number_of_pages' => get_post_meta($order->ID, 'number_of_pages', true),
            'urgency' => get_post_meta($order->ID, 'urgency', true),
            'special_instructions' => get_post_meta($order->ID, 'special_instructions', true),
            'service_type' => get_post_meta($order->ID, 'service_type', true),
            'order_status' => get_post_meta($order->ID, 'order_status', true),
            'total_price' => get_post_meta($order->ID, 'total_price', true),
            'created_at' => get_post_meta($order->ID, 'created_at', true),
            'updated_at' => get_post_meta($order->ID, 'updated_at', true),
            'order_history' => get_post_meta($order->ID, 'order_history', true),
            'client_data' => $client_data
        );
    }
    
    // Calculate correct pagination values
    $total_posts = $orders_query->found_posts;
    $max_pages = $orders_query->max_num_pages;
    
    // Ensure we don't have negative values
    if ($total_posts < 0) $total_posts = 0;
    if ($max_pages < 0) $max_pages = 0;
    
    // If no posts found, ensure pages is 0, not 1
    if ($total_posts === 0) {
        $max_pages = 0;
    }
    
    return array(
        'orders' => $result,
        'total' => $total_posts,
        'pages' => $max_pages,
        'current_page' => $page,
        'per_page' => $per_page
    );
}


/* --------------------------
 * 🔹 Custom Endpoint for Client List with Filters
 * -------------------------- */

add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/clients', array(
        'methods' => 'GET',
        'callback' => 'get_clients_with_filters',
        'permission_callback' => function() {
            return true; // Allow public access for now
        },
        'args' => array(
            'status' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter by client status'
            ),
            'service_type' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Filter by service type'
            ),
            'per_page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 10,
                'description' => 'Number of clients per page'
            ),
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 1,
                'description' => 'Page number'
            )
        )
    ));
});

function get_clients_with_filters($request) {
    $status = $request->get_param('status');
    $service_type = $request->get_param('service_type');
    $per_page = $request->get_param('per_page') ?: 10;
    $page = $request->get_param('page') ?: 1;
    
    $args = array(
        'post_type' => 'clients',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array(),
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    if ($status) {
        $args['meta_query'][] = array(
            'key' => 'client_status',
            'value' => $status,
            'compare' => '='
        );
    }
    
    if ($service_type) {
        $args['meta_query'][] = array(
            'key' => 'service_type',
            'value' => $service_type,
            'compare' => '='
        );
    }
    
    $clients_query = new WP_Query($args);
    $clients = $clients_query->posts;
    $result = array();
    
    foreach ($clients as $client) {
        $result[] = array(
            'id' => $client->ID,
            'name' => get_post_meta($client->ID, 'client_name', true),
            'code' => get_post_meta($client->ID, 'client_code', true),
            'phone' => get_post_meta($client->ID, 'client_phone', true),
            'email' => get_post_meta($client->ID, 'client_email', true),
            'service_type' => get_post_meta($client->ID, 'service_type', true),
            'client_type' => get_post_meta($client->ID, 'client_type', true),
            'status' => get_post_meta($client->ID, 'client_status', true),
            'registration_date' => get_post_meta($client->ID, 'client_registration_date', true),
            'created_at' => $client->post_date
        );
    }
    
    return array(
        'clients' => $result,
        'total' => $clients_query->found_posts,
        'pages' => $clients_query->max_num_pages,
        'current_page' => $page,
        'per_page' => $per_page
    );
}