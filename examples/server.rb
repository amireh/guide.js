require 'rubygems'
require 'sinatra'

configure do
  set :views, settings.root
end

get '/' do
  erb :"index"
end

get '*.html' do |path|
  erb :"#{path.gsub(/\.\w+/, '')}", layout: :"layout"
end