<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const updateValue = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <div class="form-control">
    <label class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <input 
      :type="type" 
      :placeholder="placeholder" 
      class="input input-bordered w-full bg-base-100 rounded-lg h-12 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" 
      :value="modelValue"
      @input="updateValue"
      :required="required" 
    />
  </div>
</template>
