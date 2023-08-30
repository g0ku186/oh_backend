const defaultNegativePrompt = 'child, childlike, Below 20, kids,';
const defaultPositivePrompt = 'adult, Above 20, mature, (masterpiece), (best quality)';

const getModelId = (style) => {
    switch (style) {
        case "classic":
            return 'ar.safetensors';
        case "sd":
            return 'dynavision.safetensors';
        case "ar":
            return 'rv51.safetensors';
        default:
            return 'icb.safetensors';
    }
}

const generateImageDimensions = (image_orientation) => {
    let width, height;
    let upscale = 'no';

    // Determine dimensions based on image orientation
    switch (image_orientation) {
        case 'square':
            width = 512;
            height = 512;
            upscale = '2';
            break;
        case 'portrait':
            width = 512;
            height = 768;
            break;
        case 'landscape':
            width = 768;
            height = 512;
            break;
        default:
            throw new Error('Invalid image orientation');
    }
    return { width, height, upscale };
};

const constructApiData = (data) => {
    const {
        instructions,
        negative_prompt = '',
        image_orientation = 'square',
        high_quality = false,
        guidance_scale = 6,
        seed = null,
        init_image = null,
        style = "classic",
    } = data;
    const { width, height, upscale } = generateImageDimensions(image_orientation);
    const model_id = getModelId(style);

    const apiData = {
        "prompt": instructions + ' ' + defaultPositivePrompt,
        "negative_prompt": defaultNegativePrompt + ' ' + negative_prompt,
        "seed": seed ? seed : -1,
        "batch_size": 1,
        "n_iter": 1,
        "steps": 20,
        "cfg_scale": guidance_scale,
        "width": width,
        "height": height,
        "restore_faces": true,
        "tiling": false,
        "model_id": model_id,
        "scheduler": "Euler",
    };

    if (init_image) {
        apiData['init_image'] = init_image;
    }

    return apiData;

}


module.exports = constructApiData;